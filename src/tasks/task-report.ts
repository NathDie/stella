import cron from 'node-cron';
import { config } from '../config.js';
import { getTasks } from '../services/task.service.js';
import type { StellaClient } from '../types.js';
import { buildTasksMessage, isDone, isOverdue } from '../utils/task-embed.js';

const SCHEDULE = '0 9 * * *';
const TIMEZONE = 'Europe/Paris';

async function runReport(client: StellaClient): Promise<void> {
    const channel = await client.channels.fetch(config.taskChannelId);
    if (!channel?.isSendable()) {
        console.error('The task channel cannot be found or is inaccessible.');
        return;
    }

    const mention = `<@${config.monitoringAlertUserId}>`;

    try {
        const tasks = await getTasks();
        const pending = tasks.filter((task) => !isDone(task));
        if (pending.length === 0) return;

        const overdueCount = pending.filter(isOverdue).length;

        await channel.send({
            content: overdueCount > 0 ? `${mention} 🚨 **${overdueCount} overdue task(s)**` : undefined,
            ...buildTasksMessage(tasks, 'pending'),
            allowedMentions: { users: [config.monitoringAlertUserId] },
        });
    } catch (error) {
        console.error(error);
        await channel.send({
            content: `${mention} ❌ Unable to fetch tasks.`,
            allowedMentions: { users: [config.monitoringAlertUserId] },
        });
    }
}

export function startTaskReport(client: StellaClient): void {
    cron.schedule(SCHEDULE, () => void runReport(client).catch(console.error), {
        timezone: TIMEZONE,
    });
}