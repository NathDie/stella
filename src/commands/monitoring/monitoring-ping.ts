import { SlashCommandBuilder } from 'discord.js';
import { getMonitorings } from '../../services/monitoring.service.js';
import type { Command } from '../../types.js';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('monitoring-ping')
        .setDescription('Teste la disponibilité de tous les sites monitorés'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const monitorings = await getMonitorings();

            const lines = await Promise.all(
                monitorings.map(async ({ name, link }) => {
                    const start = performance.now();
                    try {
                        const response = await fetch(link, { signal: AbortSignal.timeout(10_000) });
                        await response.body?.cancel();
                        const ms = Math.round(performance.now() - start);
                        return `${response.ok ? '🟢' : '🔴'} **${name}** — ${response.status} · ${ms} ms`;
                    } catch {
                        return `🔴 **${name}** — injoignable`;
                    }
                }),
            );

            await interaction.editReply(lines.join('\n') || 'Aucun monitoring enregistré.');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Impossible de tester les monitorings.');
        }
    },
};

export default command;