import { Colors, EmbedBuilder } from 'discord.js';
import type { BloodPressure } from '../models/health.js';

const MAX_DESCRIPTION = 3900;

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

function formatEntry(entry: BloodPressure): string {
    const readings = entry.readings
        .map((r, i) => `\`M${i + 1}: ${r.systolic}/${r.diastolic} — PUL ${r.pulse}\``)
        .join(' ');

    const averages =
        `Avg · SYS **${entry.average_systolic.toFixed(1)}**` +
        ` · DIA **${entry.average_diastolic.toFixed(1)}**` +
        ` · PUL **${entry.average_pulse.toFixed(1)}**`;

    return `**${formatDate(entry.date)}** · \`${entry.moment.toUpperCase()}\`\n${readings}\n${averages}\n\n`;
}

function sortEntries(entries: BloodPressure[]): BloodPressure[] {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function buildBloodPressuresEmbed(entries: BloodPressure[]): EmbedBuilder {
    const sorted = sortEntries(entries);

    let description = '';
    let shown = 0;
    for (const entry of sorted) {
        const block = formatEntry(entry);
        if (description.length + block.length > MAX_DESCRIPTION) break;
        description += block;
        shown++;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Blood pressure (${entries.length} entries)`)
        .setColor(Colors.Blurple)
        .setDescription(description.trim() || 'No entries to display.');

    if (shown < entries.length) {
        embed.setFooter({ text: `… and ${entries.length - shown} older entries` });
    }

    return embed;
}