import {punkRecordsApi} from "../clients.js";
import {Task} from "../../models/task.js";

export function getTasks(): Promise<Task[]> {
    return punkRecordsApi.get<Task[]>('/tasks/today');
}

export function completeTask(id: string): Promise<Task> {
    return punkRecordsApi.patch<Task>(`/tasks/${id}`, {
        status: 'done',
        complete_at: new Date().toISOString(),
    });
}