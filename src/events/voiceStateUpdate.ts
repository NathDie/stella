import { Events } from 'discord.js';
import {
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import { config } from '../config.js';
import type { BotEvent } from '../types.js';

const event: BotEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    async execute(_client, oldState, newState) {
        if (newState.id !== config.ownerUserId) return;

        const joinedTarget =
            newState.channelId === config.voiceChannelId &&
            oldState.channelId !== config.voiceChannelId;

        const leftTarget =
            oldState.channelId === config.voiceChannelId &&
            newState.channelId !== config.voiceChannelId;

        if (joinedTarget) {
            if (getVoiceConnection(newState.guild.id)) return;

            const connection = joinVoiceChannel({
                channelId: config.voiceChannelId,
                guildId: newState.guild.id,
                adapterCreator: newState.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
                console.log('🎙️ Stella joined the voice channel.');
            } catch (error) {
                console.error('Unable to join the voice channel in time.', error);
                connection.destroy();
            }
            return;
        }

        if (leftTarget) {
            getVoiceConnection(oldState.guild.id)?.destroy();
            console.log('👋 Stella left the voice channel.');
        }
    },
};

export default event;