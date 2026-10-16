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

interface ApiClientOptions {
    name: string;
    baseUrl: string;
    token?: string;
}

const RETRIES = 2;
const RETRY_DELAY_MS = 2_000;
const TIMEOUT_MS = 10_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Method = 'GET' | 'POST' | 'PATCH';

export function createApiClient({ name, baseUrl, token }: ApiClientOptions) {
    async function send<T>(method: Method, path: string, body?: unknown): Promise<T> {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (body !== undefined) {
            headers['Content-Type'] =
                method === 'PATCH' ? 'application/merge-patch+json' : 'application/json';
        }

        const response = await fetch(new URL(path, baseUrl), {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!response.ok) {
            const text = (await response.text()).slice(0, 500);
            throw new ApiError(
                response.status,
                `[${name}] ${response.status} ${response.statusText} on ${method} ${path}`,
                text,
            );
        }

        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
    }

    async function get<T>(path: string): Promise<T> {
        for (let attempt = 0; ; attempt++) {
            try {
                return await send<T>('GET', path);
            } catch (error) {
                const retryable = !(error instanceof ApiError) || error.status >= 500;
                if (!retryable || attempt >= RETRIES) throw error;

                console.warn(`[${name}] GET ${path} failed (attempt ${attempt + 1}), retrying...`);
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    return {
        get,
        post: <T>(path: string, body: unknown) => send<T>('POST', path, body),
        patch: <T>(path: string, body: unknown) => send<T>('PATCH', path, body),
    };
}

export type ApiClient = ReturnType<typeof createApiClient>;