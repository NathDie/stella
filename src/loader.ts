import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadModules<T>(dir: string): Promise<T[]> {
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
        (f) => /\.(ts|js)$/.test(f) && !f.endsWith('.d.ts'),
    );

    return Promise.all(
        files.map(async (f) => (await import(pathToFileURL(join(dir, f)).href)).default as T),
    );
}