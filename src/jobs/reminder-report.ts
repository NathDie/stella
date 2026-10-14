import cron from 'node-cron';
import type { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';
import {
    getTodayReminders,
    geOverdueReminders,
    processOverdueReminders,
} from '../services/reminder.service.js';
import type { Reminder } from '../models/reminder.js';
import type { StellaClient } from '../types.js';
import { buildRemindersEmbed } from '../utils/reminder-embed.js';

const TIMEZONE = 'Europe/Paris';
const TODAY_SCHEDULE = '0 9 * * *';
const TOMORROW_SCHEDULE = '0 18 * * *';

interface ReportOptions {
    fetchReminders: () => Promise<Reminder[]>;
    title: string;
    afterSend?: () => Promise<unknown>;
}

async function runReport(
    client: StellaClient,
    { fetchReminders, title, afterSend }: ReportOptions,
): Promise<void> {
    const channel = await client.channels.fetch(config.reminderChannelId);
    if (!channel?.isSendable()) {
        console.error('The reminder channel cannot be found or is inaccessible.');
        return;
    }

    const mention = `<@${config.monitoringAlertUserId}>`;
    const allowedMentions = { users: [config.monitoringAlertUserId] };

    let embed: EmbedBuilder;

    try {
        const reminders = await fetchReminders();
        if (reminders.length === 0) return;

        embed = buildRemindersEmbed(reminders, title);
    } catch (error) {
        console.error(error);
        await channel.send({
            content: `${mention} ❌ Unable to fetch reminders.`,
            allowedMentions,
        });
        return;
    }

    await channel.send({ content: mention, embeds: [embed], allowedMentions });

    await afterSend?.().catch(console.error);
}

export function startReminderReport(client: StellaClient): void {
    const options = { timezone: TIMEZONE };

    cron.schedule(
        TODAY_SCHEDULE,
        () =>
            void runReport(client, {
                fetchReminders: getTodayReminders,
                title: "Today's reminders",
                afterSend: processOverdueReminders,
            }).catch(console.error),
        options,
    );

    cron.schedule(
        TOMORROW_SCHEDULE,
        () =>
            void runReport(client, {
                fetchReminders: geOverdueReminders,
                title: "Tomorrow's reminders",
            }).catch(console.error),
        options,
    );
}