import { Events } from 'discord.js';
import type { BotEvent } from '../types.js';

const event: BotEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    once: true,
    async execute(client, readyClient) {
        console.log(`✨ Stella est connectée en tant que ${readyClient.user.tag}`);

        const body = client.commands.map((c) => c.data.toJSON());
        await Promise.all(readyClient.guilds.cache.map((guild) => guild.commands.set(body)));
    },
};

export default event;