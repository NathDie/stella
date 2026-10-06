import {
    Client, Collection,
    type ChatInputCommandInteraction,
    type ClientEvents,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

export interface Command {
    data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute(client: StellaClient, ...args: ClientEvents[K]): Promise<void> | void;
}

export class StellaClient extends Client {
    commands = new Collection<string, Command>();
}