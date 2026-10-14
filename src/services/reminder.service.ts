import {apiGet, apiPost} from './api.js';
import {Reminder} from "../models/reminder.js";

export function getTodayReminders(): Promise<Reminder[]> {
    return apiGet<Reminder[]>('/reminders/today');
}

export function getUpcomingReminders(): Promise<Reminder[]> {
    return apiGet<Reminder[]>('/reminders/upcoming');
}

export function geOverdueReminders(): Promise<Reminder[]> {
    return apiGet<Reminder[]>('/reminders/overdue');
}

export function processOverdueReminders(): Promise<unknown> {
    return apiPost<unknown>('/reminders/process', {});
}