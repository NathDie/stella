import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getMonitorings } from '../../services/monitoring.service.js';
import type { Command } from '../../types.js';

const MAX_DESCRIPTION = 3900;

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('monitoring-list')
        .setDescription('Displays the list of monitoring activities'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const monitorings = await getMonitorings();

            if (monitorings.length === 0) {
                await interaction.editReply('Aucun monitoring enregistré.');
                return;
            }

            let description = '';
            let shown = 0;
            for (const m of monitorings) {
                const line = `• **${m.name}** — ${m.link}\n`;
                if (description.length + line.length > MAX_DESCRIPTION) break;
                description += line;
                shown++;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Monitorings (${monitorings.length})`)
                .setDescription(description);

            if (shown < monitorings.length) {
                embed.setFooter({ text: `… et ${monitorings.length - shown} autre(s)` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply("❌ Impossible de récupérer les monitorings.");
        }
    },
};

export default command;