import cron from 'node-cron';
import { config } from '../config.js';
import { pingMonitorings } from '../services/monitoring.service.js';
import type { StellaClient } from '../types.js';

const TIMEZONE = 'Europe/Paris';
const FULL_REPORT_SCHEDULE = '0 10,14,18 * * *';
const SILENT_CHECK_SCHEDULE = '0 0-9,11-13,15-17,19-23 * * *';

async function runReport(client: StellaClient, onlyIfDown: boolean): Promise<void> {
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
        if (onlyIfDown && downCount === 0) return;

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
    const options = { timezone: TIMEZONE };

    cron.schedule(
        FULL_REPORT_SCHEDULE,
        () => void runReport(client, false).catch(console.error),
        options,
    );

    cron.schedule(
        SILENT_CHECK_SCHEDULE,
        () => void runReport(client, true).catch(console.error),
        options,
    );
}