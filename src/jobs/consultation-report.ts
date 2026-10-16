import cron from 'node-cron';
import { config } from '../config.js';
import { getBloodPressures } from '../services/strawboard/blood-pressure.service.js';
import { getConsultation } from '../services/strawboard/consultation.service.js';
import type { StellaClient } from '../types.js';
import {
    buildBloodPressuresEmbed
} from '../utils/blood-pressure-embed.js';

const SCHEDULE = '0 9 * * *';
const TIMEZONE = 'Europe/Paris';

const dayKey = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-CA', { timeZone: TIMEZONE });

async function runReport(client: StellaClient): Promise<void> {
    const channel = await client.channels.fetch(config.strawboardChannelId);
    if (!channel?.isSendable()) {
        console.error('The strawboard channel cannot be found or is inaccessible.');
        return;
    }

    const mention = `<@${config.monitoringAlertUserId}>`;

    try {
        const consultation = await getConsultation();

        if (!consultation || dayKey(consultation.date) !== dayKey(new Date())) return;

        const year = dayKey(new Date()).slice(0, 4);
        const entries = (await getBloodPressures()).filter((entry) => entry.date.startsWith(year));

        if (entries.length === 0) {
            await channel.send(`🩺 Consultation today, but no blood pressure entries recorded in ${year}.`);
            return;
        }

        await channel.send({
            content: `🩺 **Consultation today**: here is your ${year} blood pressure report.`,
            embeds: [
                buildBloodPressuresEmbed(entries),
            ],
        });
    } catch (error) {
        console.error(error);
        await channel.send({
            content: `${mention} ❌ Unable to build the consultation report.`,
            allowedMentions: { users: [config.monitoringAlertUserId] },
        });
    }
}

export function startConsultationReport(client: StellaClient): void {
    cron.schedule(SCHEDULE, () => void runReport(client).catch(console.error), {
        timezone: TIMEZONE,
    });
}