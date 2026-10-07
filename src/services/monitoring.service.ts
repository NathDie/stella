import type { Monitoring } from '../models/monitoring.js';
import { apiGet } from './api.js';

export function getMonitorings(): Promise<Monitoring[]> {
    return apiGet<Monitoring[]>('/monitorings');
}

export async function pingMonitorings(): Promise<{ lines: string[]; downCount: number }> {
    const monitorings = await getMonitorings();

    const results = await Promise.all(
        monitorings.map(async ({ name, link }) => {
            const start = performance.now();
            try {
                const response = await fetch(link, { signal: AbortSignal.timeout(10_000) });
                await response.body?.cancel();
                const ms = Math.round(performance.now() - start);
                return {
                    up: response.ok,
                    line: `${response.ok ? '🟢' : '🔴'} **${name}** — ${response.status} · ${ms} ms`,
                };
            } catch {
                return { up: false, line: `🔴 **${name}** — injoignable` };
            }
        }),
    );

    return {
        lines: results.map((r) => r.line),
        downCount: results.filter((r) => !r.up).length,
    };
}