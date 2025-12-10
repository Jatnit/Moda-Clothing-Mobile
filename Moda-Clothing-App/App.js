import React from 'react';
import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: ...',
  'Sending `onAnimatedValueUpdate`',
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <HomeScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
