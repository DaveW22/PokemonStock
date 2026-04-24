import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/services/notificationService';
import { registerBackgroundTask } from './src/services/stockChecker';

export default function App() {
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  useEffect(() => {
    // Request permission and register background task on first launch
    registerForPushNotifications();
    registerBackgroundTask();

    // Log incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[App] Notification received:', notification);
    });

    // Handle taps on notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[App] Notification tapped:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
