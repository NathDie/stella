import {
    ActionRowBuilder,
    Colors,
    EmbedBuilder,
    StringSelectMenuBuilder,
    type BaseMessageOptions,
} from 'discord.js';
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
        .setDescription(description || 'No tasks to display.');

    if (shown < tasks.length) {
        embed.setFooter({ text: `… and ${tasks.length - shown} more` });
    } else if (overdueCount > 0) {
        embed.setFooter({ text: `${overdueCount} overdue task(s)` });
    }

    return embed;
}

export const TASK_DONE_MENU_ID = 'task-done';

export type TasksView = 'all' | 'pending';

function buildTasksMenu(tasks: Task[], view: TasksView) {
    const pending = sortTasks(tasks)
        .filter((task) => !isDone(task))
        .slice(0, 25);

    if (pending.length === 0) return [];

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`${TASK_DONE_MENU_ID}:${view}`)
        .setPlaceholder('Mark a task as done…')
        .addOptions(
            pending.map((task) => ({
                label: task.title.slice(0, 100),
                value: task.id,
                emoji: { name: PRIORITY_EMOJI[task.priority.toLowerCase()] ?? '⚪' },
                ...(task.description
                    ? { description: task.description.replace(/\s+/g, ' ').slice(0, 100) }
                    : {}),
            })),
        );

    return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)];
}

export function buildTasksMessage(
    tasks: Task[],
    view: TasksView,
): Pick<BaseMessageOptions, 'embeds' | 'components'> {
    const pending = tasks.filter((task) => !isDone(task));
    const displayed = view === 'pending' ? pending : tasks;

    return {
        embeds: [
            buildTasksEmbed(
                displayed,
                view === 'pending' ? `Pending tasks (${pending.length})` : undefined,
            ),
        ],
        components: buildTasksMenu(displayed, view),
    };
}