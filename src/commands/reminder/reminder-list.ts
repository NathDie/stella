import { SlashCommandBuilder } from 'discord.js';
import {getTodayReminders, processOverdueReminders} from '../../services/reminder.service.js';
import { buildRemindersEmbed } from '../../utils/reminder-embed.js';
import type { Command } from '../../types.js';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('reminder-list')
        .setDescription('Display the list of reminders'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const reminders = await getTodayReminders();

            if (reminders.length === 0) {
                await interaction.editReply('No reminders found.');
                return;
            }

            await interaction.editReply({
                embeds: [buildRemindersEmbed(reminders)],
            });

            await processOverdueReminders();
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                '❌ Unable to fetch reminders.',
            );
        }
    },
};

export default command;