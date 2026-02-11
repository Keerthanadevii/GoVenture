import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export default class NotificationService {
    static async requestPermissions() {
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        if (Platform.OS === 'android' && isExpoGo) {
            console.warn("Notifications disabled in Expo Go Android.");
            return false;
        }

        let Notifications: any;
        try {
            Notifications = await import('expo-notifications');
        } catch (error) {
            console.warn("expo-notifications module not available:", error);
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }
        return true;
    }

    static async scheduleNotification(title: string, body: string, triggerDate: Date) {
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        if (Platform.OS === 'android' && isExpoGo) {
            console.warn("Notifications disabled in Expo Go Android.");
            return;
        }

        let Notifications: any;
        try {
            Notifications = await import('expo-notifications');
        } catch (error) {
            console.warn("expo-notifications module not available:", error);
            return;
        }

        // Ensure date is in the future
        if (triggerDate.getTime() <= Date.now()) {
            console.warn("Notification scheduled for past time. Adjusting to 1 minute from now for testing.");
            triggerDate = new Date(Date.now() + 60 * 1000);
        }

        const trigger = triggerDate;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
            },
            trigger,
        });
    }

    static async cancelAllNotifications() {
        try {
            const Notifications = await import('expo-notifications');
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.warn("expo-notifications module not available:", error);
        }
    }
}
