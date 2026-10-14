import { Colors, EmbedBuilder } from 'discord.js';
import type { Reminder } from '../models/reminder.js';

const MAX_DESCRIPTION = 3900;

const toUnix = (date: string) =>
    Math.floor(new Date(date).getTime() / 1000);

function formatReminder(reminder: Reminder): string {
    const recurring = reminder.recurring
        ? ` · 🔁 \`${reminder.recurring}\``
        : '';

    let line = `**${reminder.title}** · ${recurring}`;

    if (reminder.description) {
        const summary = reminder.description
            .replace(/\s+/g, ' ')
            .slice(0, 100);

        line += `\n> ${summary}${reminder.description.length > 100 ? '…' : ''}`;
    }

    return `${line}\n`;
}

function sortReminders(reminders: Reminder[]): Reminder[] {
    return [...reminders].sort((a, b) => {
        return (a.remind_at || '9999').localeCompare(
            b.remind_at || '9999',
        );
    });
}

export function buildRemindersEmbed(
    reminders: Reminder[],
    title = 'Reminders',
): EmbedBuilder {
    const sorted = sortReminders(reminders);

    let description = '';
    let shown = 0;

    for (const reminder of sorted) {
        const line = formatReminder(reminder);

        if (description.length + line.length > MAX_DESCRIPTION) {
            break;
        }

        description += line;
        shown++;
    }

    const embed = new EmbedBuilder()
        .setTitle(`${title} (${reminders.length})`)
        .setColor(Colors.Blurple,)
        .setDescription(description || 'No reminders to display.');

    if (shown < reminders.length) {
        embed.setFooter({
            text: `… and ${reminders.length - shown} more`,
        });
    }

    return embed;
}