import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export interface UsePushNotificationProps {
  notificationBehaviour?: Notifications.NotificationBehavior;
  channelProps?: {
    channelId: string;
    channel: Notifications.NotificationChannelInput;
  };
}

export const usePushNotifications = ({
  notificationBehaviour,
  channelProps,
}: UsePushNotificationProps = {}): PushNotificationState => {
  const defaultBehaviour = {
    shouldPlaySound: true,
    shouldShowAlert: true,
    shouldSetBadge: true,
  };
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      ...defaultBehaviour,
      ...notificationBehaviour,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Unable to register for push notifications');
        return;
      }
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync(
          channelProps?.channelId ?? 'default',
          channelProps?.channel ?? {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 255, 255, 255],
            lightColor: '#FF231F',
          }
        );
      }
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });
      return token;
    } else {
      Alert.alert('You need to use real device to see push notifications');
      return;
    }
  }
  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      setExpoPushToken(token);
      if (token) await SecureStore.setItemAsync('expoPushToken', token.data);
    });
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notificationReceived) => {
        setNotification(notificationReceived);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) =>
        console.log(response)
      );
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  });

  return { expoPushToken, notification };
};
