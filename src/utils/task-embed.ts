import { Colors, EmbedBuilder } from 'discord.js';
import type { Task } from '../models/task.js';

const MAX_DESCRIPTION = 3900;

const PRIORITY_EMOJI: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
};

export const isDone = (task: Task) => Boolean(task.complete_at);

const toUnix = (date: string) => Math.floor(new Date(date).getTime() / 1000);

export const isOverdue = (task: Task) =>
    !isDone(task) && Boolean(task.due_at) && toUnix(task.due_at) < Date.now() / 1000;

function formatTask(task: Task): string {
    const state = isDone(task) ? '✅' : isOverdue(task) ? '⚠️' : '⬜';
    const priority = PRIORITY_EMOJI[task.priority.toLowerCase()] ?? '⚪';
    const due = task.due_at ? ` · <t:${toUnix(task.due_at)}:R>` : '';

    let line = `${state} ${priority} **${task.title}** · \`${task.status}\`${due}`;

    if (task.description) {
        const summary = task.description.replace(/\s+/g, ' ').slice(0, 80);
        line += `\n> ${summary}${task.description.length > 80 ? '…' : ''}`;
    }

    return `${line}\n`;
}

function sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
        if (isDone(a) !== isDone(b)) return Number(isDone(a)) - Number(isDone(b));
        return (a.due_at || '9999').localeCompare(b.due_at || '9999');
    });
}

export function buildTasksEmbed(tasks: Task[], title?: string): EmbedBuilder {
    const sorted = sortTasks(tasks);

    let description = '';
    let shown = 0;
    for (const task of sorted) {
        const line = formatTask(task);
        if (description.length + line.length > MAX_DESCRIPTION) break;
        description += line;
        shown++;
    }

    const doneCount = tasks.filter(isDone).length;
    const overdueCount = tasks.filter(isOverdue).length;

    const embed = new EmbedBuilder()
        .setTitle(title ?? `Tasks (${doneCount}/${tasks.length} completed)`)
        .setColor(overdueCount > 0 ? Colors.Red : Colors.Blurple)
        .setDescription(description);

    if (shown < tasks.length) {
        embed.setFooter({ text: `… and ${tasks.length - shown} more` });
    } else if (overdueCount > 0) {
        embed.setFooter({ text: `${overdueCount} overdue task(s)` });
    }

    return embed;
}