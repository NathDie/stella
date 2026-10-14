import { EndBehaviorType, type VoiceConnection } from '@discordjs/voice';
import prism from 'prism-media';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.js';

const SAMPLE_RATE = 48_000;
const CHANNELS = 2;
const BYTES_PER_SECOND = SAMPLE_RATE * CHANNELS * 2;

const SILENCE_MS = 2_500;
const MIN_DURATION_S = 0.5;
const OUTPUT_DIR = join(process.cwd(), 'recordings');

function buildWav(pcm: Buffer): Buffer {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(CHANNELS, 22);
    header.writeUInt32LE(SAMPLE_RATE, 24);
    header.writeUInt32LE(BYTES_PER_SECOND, 28);
    header.writeUInt16LE(CHANNELS * 2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
}

async function saveRecording(pcm: Buffer): Promise<void> {
    const duration = pcm.length / BYTES_PER_SECOND;
    if (duration < MIN_DURATION_S) return;

    await mkdir(OUTPUT_DIR, { recursive: true });
    const file = join(OUTPUT_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}.wav`);
    await writeFile(file, buildWav(pcm));

    console.log(`🎧 Saved ${file} (${duration.toFixed(1)} s)`);
}

export function startListening(connection: VoiceConnection): void {
    const { receiver } = connection;

    receiver.speaking.on('start', (userId) => {
        if (userId !== config.ownerUserId) return;
        if (receiver.subscriptions.has(userId)) return;

        const opusStream = receiver.subscribe(userId, {
            end: { behavior: EndBehaviorType.AfterSilence, duration: SILENCE_MS },
        });

        const decoder = new prism.opus.Decoder({
            rate: SAMPLE_RATE,
            channels: CHANNELS,
            frameSize: 960,
        });

        const chunks: Buffer[] = [];
        decoder.on('data', (chunk: Buffer) => chunks.push(chunk));
        decoder.on('end', () => void saveRecording(Buffer.concat(chunks)).catch(console.error));

        opusStream.on('error', (error) => console.error('Opus stream error:', error.message));
        decoder.on('error', (error) => console.error('Decoder error:', error.message));

        opusStream.pipe(decoder);
    });
}