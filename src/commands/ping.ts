import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types.js';

const command: Command = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Teste la latence de Stella'),
    async execute(interaction) {
        await interaction.reply(`🏓 Pong ! (${interaction.client.ws.ping} ms)`);
    },
};

export default command;