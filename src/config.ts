function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
    return value;
}

export const config = {
    apiUrl: required('API_URL'),
    monitoringChannelId: required('MONITORING_CHANNEL_ID'),
    monitoringAlertUserId: required('MONITORING_ALERT_USER_ID'),
};