import { GatewayIntentBits } from 'discord.js';
import { join } from 'node:path';
import { loadModules } from './loader.js';
import { StellaClient, type BotEvent, type Command } from './types.js';

const client = new StellaClient({ intents: [GatewayIntentBits.Guilds] });

for (const command of await loadModules<Command>(join(import.meta.dirname, 'commands'))) {
    client.commands.set(command.data.name, command);
}

for (const event of await loadModules<BotEvent>(join(import.meta.dirname, 'events'))) {
    const run = (...args: unknown[]) => (event.execute as (...a: unknown[]) => unknown)(client, ...args);
    if (event.once) client.once(event.name, run);
    else client.on(event.name, run);
}

await client.login(process.env.DISCORD_TOKEN);