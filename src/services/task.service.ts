import { apiGet } from './api.js';
import {Task} from "../models/task.js";

export function getTasks(): Promise<Task[]> {
    return apiGet<Task[]>('/tasks/today');
}
