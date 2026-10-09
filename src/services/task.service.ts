import {apiGet, apiPatch} from './api.js';
import {Task} from "../models/task.js";

export function getTasks(): Promise<Task[]> {
    return apiGet<Task[]>('/tasks/today');
}

export function completeTask(id: string): Promise<Task> {
    return apiPatch<Task>(`/tasks/${id}`, {
        status: 'done',
        complete_at: new Date().toISOString(),
    });
}