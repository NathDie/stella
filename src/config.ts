function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
    return value;
}

export const config = {
    apiUrl: required('API_URL'),
    apiToken: required('API_TOKEN'),
    apiUrlStrawboard: required('API_URL_STRAWBOARD'),
    apiTokenStrawboard: required('API_TOKEN_STRAWBOARD'),
    monitoringChannelId: required('MONITORING_CHANNEL_ID'),
    strawboardChannelId: required('STRAWBOARD_CHANNEL_ID'),
    taskChannelId: required('TASK_CHANNEL_ID'),
    reminderChannelId: required('REMINDER_CHANNEL_ID'),
    monitoringAlertUserId: required('MONITORING_ALERT_USER_ID'),
    voiceChannelId: required('VOICE_CHANNEL_ID'),
    ownerUserId: required('OWNER_USER_ID'),
};