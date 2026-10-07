import { SlashCommandBuilder } from 'discord.js';
import { pingMonitorings } from '../../services/monitoring.service.js';
import type { Command } from '../../types.js';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('monitoring-ping')
        .setDescription('Check the availability of all monitored sites'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { lines } = await pingMonitorings();
            await interaction.editReply(lines.join('\n') || 'No monitoring data recorded.');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ It is impossible to test the monitoring systems.');
        }
    },
};

export default command;