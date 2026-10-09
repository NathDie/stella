import { config } from '../config.js';

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly body?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

const RETRIES = 2;
const RETRY_DELAY_MS = 2_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiGet<T>(path: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await fetch(new URL(path, config.apiUrl), {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(10_000),
            });

            if (!response.ok) {
                const body = (await response.text()).slice(0, 500);
                throw new ApiError(response.status, `${response.status} ${response.statusText} on ${path}`, body);
            }

            return (await response.json()) as T;
        } catch (error) {
            const retryable = !(error instanceof ApiError) || error.status >= 500;
            if (!retryable || attempt >= RETRIES) throw error;

            console.warn(`GET ${path} failed (attempt ${attempt + 1}), retrying...`);
            await sleep(RETRY_DELAY_MS);
        }
    }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(new URL(path, config.apiUrl), {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/merge-patch+json',
            Authorization: `Bearer ${config.apiToken}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        const text = (await response.text()).slice(0, 500);
        throw new ApiError(response.status, `${response.status} ${response.statusText} on ${path}`, text);
    }

    return (await response.json()) as T;
}