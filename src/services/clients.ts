import { config } from '../config.js';
import { createApiClient } from './api.js';

export const punkRecordsApi = createApiClient({
    name: 'punk-records',
    baseUrl: config.apiUrl,
    token: config.apiToken,
});

export const strawboardApi = createApiClient({
    name: 'strawboard',
    baseUrl: config.apiUrlStrawboard,
    queryParams: { token: config.apiTokenStrawboard },
});