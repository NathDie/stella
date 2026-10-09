import { SlashCommandBuilder } from 'discord.js';
import { getTasks } from '../../services/task.service.js';
import { buildTasksMessage } from '../../utils/task-embed.js';
import type { Command } from '../../types.js';

const command: Command = {
    data: new SlashCommandBuilder().setName('task-list').setDescription('Display the list of tasks'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const tasks = await getTasks();

            if (tasks.length === 0) {
                await interaction.editReply('No tasks found.');
                return;
            }

            await interaction.editReply(buildTasksMessage(tasks, 'all'));
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Unable to fetch tasks.');
        }
    },
};

export default command;