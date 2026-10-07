import cron from 'node-cron';
import { config } from '../config.js';
import { pingMonitorings } from '../services/monitoring.service.js';
import type { StellaClient } from '../types.js';

const SCHEDULE = '0 8,20 * * *';
const TIMEZONE = 'Europe/Paris';

async function runReport(client: StellaClient): Promise<void> {
    const channel = await client.channels.fetch(config.monitoringChannelId);
    if (!channel?.isSendable()) {
        console.error('The monitoring channel cannot be found or is inaccessible.');
        return;
    }

    const mention = `<@${config.monitoringAlertUserId}>`;
    let content: string;

    try {
        const { lines, downCount } = await pingMonitorings();

        if (lines.length === 0) return;

        content =
            downCount > 0
                ? `${mention} 🚨 **${downCount} unreachable site(s)**\n${lines.join('\n')}`
                : `✅ **All websites are online**\n${lines.join('\n')}`;
    } catch (error) {
        console.error(error);
        content = `${mention} ❌ It is impossible to retrieve or test the monitoring data.`;
    }

    await channel.send({
        content,
        allowedMentions: { users: [config.monitoringAlertUserId] },
    });
}

export function startMonitoringReport(client: StellaClient): void {
    cron.schedule(SCHEDULE, () => void runReport(client).catch(console.error), {
        timezone: TIMEZONE,
    });
}