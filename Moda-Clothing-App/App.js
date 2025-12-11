import React, { useState, useEffect } from 'react';
import { StyleSheet, LogBox, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Services
import authService from './src/services/authService';
import { colors } from './src/theme/colors';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: ...',
  'Sending `onAnimatedValueUpdate`',
]);

const Stack = createNativeStackNavigator();

// Auth Stack - màn hình đăng nhập/đăng ký
const AuthStack = ({ onAuthSuccess }) => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Login">
      {(props) => <LoginScreen {...props} onLoginSuccess={onAuthSuccess} />}
    </Stack.Screen>
    <Stack.Screen name="Register">
      {(props) => <RegisterScreen {...props} onRegisterSuccess={onAuthSuccess} />}
    </Stack.Screen>
  </Stack.Navigator>
);

// Main Stack - màn hình chính sau khi đăng nhập
const MainStack = ({ user, onLogout }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Home">
      {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Check auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {user ? (
          <MainStack user={user} onLogout={handleLogout} />
        ) : (
          <AuthStack onAuthSuccess={handleAuthSuccess} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
