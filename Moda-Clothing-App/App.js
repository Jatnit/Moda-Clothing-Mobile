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
import ProfileScreen from './src/screens/ProfileScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import CartScreen from './src/screens/CartScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';
import CategoryProductsScreen from './src/screens/CategoryProductsScreen';
import SearchScreen from './src/screens/SearchScreen';

// Services
import authService from './src/services/authService';
import { colors } from './src/theme/colors';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: ...',
  'Sending `onAnimatedValueUpdate`',
]);

const Stack = createNativeStackNavigator();

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
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* Home Screen - luôn hiển thị, có thể chưa đăng nhập */}
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen 
                {...props} 
                user={user} 
                onLogout={handleLogout} 
              />
            )}
          </Stack.Screen>

          {/* Auth Screens */}
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen 
                {...props} 
                onLoginSuccess={handleAuthSuccess} 
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register">
            {(props) => (
              <RegisterScreen 
                {...props} 
                onRegisterSuccess={handleAuthSuccess} 
              />
            )}
          </Stack.Screen>

          {/* Profile Screen */}
          <Stack.Screen name="Profile">
            {(props) => (
              <ProfileScreen 
                {...props} 
                user={user}
                onUserUpdate={setUser}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>

          {/* Orders Screen */}
          <Stack.Screen name="Orders">
            {(props) => (
              <OrdersScreen {...props} />
            )}
          </Stack.Screen>

          {/* Order Detail Screen */}
          <Stack.Screen name="OrderDetail">
            {(props) => (
              <OrderDetailScreen {...props} />
            )}
          </Stack.Screen>

          {/* Cart Screen */}
          <Stack.Screen name="Cart">
            {(props) => (
              <CartScreen {...props} />
            )}
          </Stack.Screen>

          {/* Notifications Screen */}
          <Stack.Screen name="Notifications">
            {(props) => (
              <NotificationsScreen {...props} />
            )}
          </Stack.Screen>

          {/* Product Detail Screen */}
          <Stack.Screen name="ProductDetail">
            {(props) => (
              <ProductDetailScreen {...props} />
            )}
          </Stack.Screen>

          {/* Checkout Screen */}
          <Stack.Screen name="Checkout">
            {(props) => (
              <CheckoutScreen {...props} />
            )}
          </Stack.Screen>

          {/* Wishlist Screen */}
          <Stack.Screen name="Wishlist">
            {(props) => (
              <WishlistScreen {...props} />
            )}
          </Stack.Screen>

          {/* Reviews Screen */}
          <Stack.Screen name="Reviews">
            {(props) => (
              <ReviewsScreen {...props} />
            )}
          </Stack.Screen>

          {/* Category Products Screen */}
          <Stack.Screen name="CategoryProducts">
            {(props) => (
              <CategoryProductsScreen {...props} />
            )}
          </Stack.Screen>

          {/* Search Screen */}
          <Stack.Screen name="Search">
            {(props) => (
              <SearchScreen {...props} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
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
