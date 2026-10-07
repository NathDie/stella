import { config } from '../config.js';

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiGet<T>(path: string): Promise<T> {
    const response = await fetch(new URL(path, config.apiUrl), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new ApiError(response.status, `${response.status} ${response.statusText} sur ${path}`);
    }

    return (await response.json()) as T;
}