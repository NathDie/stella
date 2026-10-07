import type { Monitoring } from '../models/monitoring.js';
import { apiGet } from './api.js';

export function getMonitorings(): Promise<Monitoring[]> {
    return apiGet<Monitoring[]>('/monitorings');
}