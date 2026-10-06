import { Events, MessageFlags } from 'discord.js';
import type { BotEvent } from '../types.js';

const event: BotEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const payload = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral } as const;
            if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
            else await interaction.reply(payload);
        }
    },
};

export default event;