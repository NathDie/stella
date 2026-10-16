import {Reminder} from "../../models/reminder.js";
import {punkRecordsApi} from "../clients.js";

export function getTodayReminders(): Promise<Reminder[]> {
    return punkRecordsApi.get<Reminder[]>('/reminders/today');
}

export function getUpcomingReminders(): Promise<Reminder[]> {
    return punkRecordsApi.get<Reminder[]>('/reminders/upcoming');
}

export function geOverdueReminders(): Promise<Reminder[]> {
    return punkRecordsApi.get<Reminder[]>('/reminders/overdue');
}

export function processOverdueReminders(): Promise<unknown> {
    return punkRecordsApi.post<unknown>('/reminders/process', {});
}