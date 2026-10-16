import { SlashCommandBuilder } from 'discord.js';
import { buildBloodPressuresEmbed } from '../../utils/blood-pressure-embed.js';
import type { Command } from '../../types.js';
import {getBloodPressures} from "../../services/strawboard/blood-pressure.service.js";

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('blood-pressure-list')
        .setDescription('Display the list of blood pressure'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const bloodPressures = await getBloodPressures();

            if (bloodPressures.length === 0) {
                await interaction.editReply('No blood pressures found.');
                return;
            }

            await interaction.editReply({
                embeds: [buildBloodPressuresEmbed(bloodPressures)],
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                '❌ Unable to fetch blood pressures.',
            );
        }
    },
};

export default command;