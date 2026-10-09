import { Events, MessageFlags } from 'discord.js';
import { completeTask, getTasks } from '../services/task.service.js';
import { buildTasksMessage, TASK_DONE_MENU_ID } from '../utils/task-embed.js';
import type { BotEvent } from '../types.js';

const event: BotEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    async execute(client, interaction) {
        if (interaction.isAutocomplete()) {
            try {
                await client.commands.get(interaction.commandName)?.autocomplete?.(interaction);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        if (interaction.isStringSelectMenu()) {
            const [menuId, view] = interaction.customId.split(':');
            if (menuId !== TASK_DONE_MENU_ID) return;

            await interaction.deferUpdate();

            try {
                const taskId = interaction.values[0];

                const task = await completeTask(taskId);
                const tasks = await getTasks();

                await interaction.editReply(
                    buildTasksMessage(tasks, view === 'pending' ? 'pending' : 'all'),
                );

                await interaction.followUp({
                    content: `✅ Task **${task.title}** marked as done.`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.error(error);
                await interaction.followUp({
                    content: '❌ Unable to complete this task.',
                    flags: MessageFlags.Ephemeral,
                });
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const payload = { content: '❌ An error occurred.', flags: MessageFlags.Ephemeral } as const;
            if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
            else await interaction.reply(payload);
        }
    },
};

export default event;