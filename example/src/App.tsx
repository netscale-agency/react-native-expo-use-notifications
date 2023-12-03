import * as React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { usePushNotifications } from 'react-native-expo-use-notifications';

export default function App() {
  const { expoPushToken } = usePushNotifications();

  return (
    <View style={styles.container}>
      <Text>Result: {expoPushToken}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
