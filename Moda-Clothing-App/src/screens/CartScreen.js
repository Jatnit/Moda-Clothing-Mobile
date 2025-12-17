import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, shadows } from '../theme/colors';
import cartService from '../services/cartService';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(null); // Track which item is being updated

  // Fetch cart from API
  const fetchCart = async () => {
    try {
      const response = await cartService.getCart();
      console.log('📦 Cart API Response:', JSON.stringify(response, null, 2));
      if (response.success) {
        const items = response.data?.items || [];
        console.log('🛒 Cart Items with SkuId:', items.map(i => ({ name: i.ProductName, SkuId: i.SkuId })));
        setCartItems(items);
      }
    } catch (error) {
      console.log('Fetch cart error:', error.message);
      if (error.message?.includes('401') || error.message?.includes('token')) {
        // Not logged in - show empty cart
        setCartItems([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart();
  }, []);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Update quantity
  const updateQuantity = async (cartId, currentQty, delta) => {
    const newQuantity = currentQty + delta;
    
    if (newQuantity < 1) return;
    
    setUpdating(cartId);
    try {
      const response = await cartService.updateQuantity(cartId, newQuantity);
      if (response.success) {
        setCartItems(items =>
          items.map(item =>
            item.CartId === cartId ? { ...item, Quantity: newQuantity } : item
          )
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể cập nhật số lượng');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật số lượng');
    } finally {
      setUpdating(null);
    }
  };

  // Remove item
  const removeItem = (cartId) => {
    Alert.alert(
      'Xóa sản phẩm',
      'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cartService.removeFromCart(cartId);
              if (response.success) {
                setCartItems(items => items.filter(item => item.CartId !== cartId));
              } else {
                Alert.alert('Lỗi', response.message);
              }
            } catch (error) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa sản phẩm');
            }
          },
        },
      ]
    );
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;
  const itemCount = cartItems.reduce((sum, item) => sum + item.Quantity, 0);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng');
      return;
    }

    // Chuyển đổi format cho checkout
    const checkoutItems = cartItems.map(item => ({
      skuId: item.SkuId,
      productId: item.ProductId,
      name: item.ProductName,
      price: item.Price,
      color: { Value: item.ColorName },
      size: { Value: item.SizeName },
      quantity: item.Quantity,
      image: item.ThumbnailUrl,
    }));

    navigation?.navigate?.('Checkout', {
      items: checkoutItems,
      total,
    });
  };

  // Render cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.ThumbnailUrl || 'https://placehold.co/200x200/f5f5f5/666' }} 
        style={styles.itemImage} 
      />

      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.ProductName}</Text>
        <View style={styles.itemVariants}>
          {item.ColorName && <Text style={styles.variantText}>Màu: {item.ColorName}</Text>}
          {item.SizeName && <Text style={styles.variantText}>Size: {item.SizeName}</Text>}
        </View>
        <Text style={styles.itemPrice}>{formatPrice(item.Price)}</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.CartId)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>

        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={[styles.quantityButton, updating === item.CartId && styles.quantityButtonDisabled]}
            onPress={() => updateQuantity(item.CartId, item.Quantity, -1)}
            disabled={updating === item.CartId || item.Quantity <= 1}
          >
            <Ionicons name="remove" size={16} color={item.Quantity <= 1 ? colors.textLight : colors.textPrimary} />
          </TouchableOpacity>
          
          {updating === item.CartId ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ width: 30 }} />
          ) : (
            <Text style={styles.quantityText}>{item.Quantity}</Text>
          )}
          
          <TouchableOpacity
            style={[styles.quantityButton, updating === item.CartId && styles.quantityButtonDisabled]}
            onPress={() => updateQuantity(item.CartId, item.Quantity, 1)}
            disabled={updating === item.CartId || item.Quantity >= item.StockQuantity}
          >
            <Ionicons 
              name="add" 
              size={16} 
              color={item.Quantity >= item.StockQuantity ? colors.textLight : colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={60} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá ngay!
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => navigation?.navigate?.('Home')}
      >
        <Text style={styles.shopNowButtonText}>Mua sắm ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          {itemCount > 0 && (
            <Text style={styles.itemCountText}>{itemCount} sản phẩm</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Cart Items */}
      {cartItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.CartId?.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>Miễn phí</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Thanh toán</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // List
  listContainer: {
    padding: 16,
    paddingBottom: 10,
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    ...shadows.small,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemVariants: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  variantText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 6,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    width: 30,
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopNowButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },

  // Summary
  summaryContainer: {
    backgroundColor: colors.background,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CartScreen;
