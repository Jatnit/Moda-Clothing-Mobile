import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import orderService from '../services/orderService';

// Order status colors & icons
const STATUS_CONFIG = {
  'Mới': { color: '#3b82f6', icon: 'time-outline', bg: '#dbeafe' },
  'Đang xử lý': { color: '#f59e0b', icon: 'reload-outline', bg: '#fef3c7' },
  'Đang giao': { color: '#8b5cf6', icon: 'bicycle-outline', bg: '#ede9fe' },
  'Hoàn thành': { color: '#10b981', icon: 'checkmark-circle-outline', bg: '#d1fae5' },
  'Đã hủy': { color: '#ef4444', icon: 'close-circle-outline', bg: '#fee2e2' },
};

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'Mới', label: 'Mới' },
    { key: 'Đang xử lý', label: 'Đang xử lý' },
    { key: 'Đang giao', label: 'Đang giao' },
    { key: 'Hoàn thành', label: 'Hoàn thành' },
    { key: 'Đã hủy', label: 'Đã hủy' },
  ];

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const params = {};
      if (selectedTab !== 'all') {
        params.status = selectedTab;
      }
      
      const response = await orderService.getOrders(params);
      if (response.success) {
        // API trả về response.data.orders
        setOrders(response.data?.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Handle view order detail
  const handleViewOrder = (order) => {
    navigation?.navigate?.('OrderDetail', { orderId: order.Id, order });
  };

  // Handle cancel order
  const handleCancelOrder = async (order) => {
    if (order.Status !== 'Mới') {
      Alert.alert('Không thể hủy', 'Chỉ có thể hủy đơn hàng ở trạng thái "Mới"');
      return;
    }

    Alert.alert(
      'Hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng #${order.Id}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderService.cancelOrder(order.Id);
              if (response.success) {
                Alert.alert('Thành công', 'Đơn hàng đã được hủy');
                fetchOrders();
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể hủy đơn hàng');
              }
            } catch (error) {
              Alert.alert('Lỗi', error.message || 'Không thể hủy đơn hàng');
            }
          },
        },
      ]
    );
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render order item
  const renderOrderItem = ({ item: order }) => {
    const statusConfig = STATUS_CONFIG[order.Status] || STATUS_CONFIG['Mới'];
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => handleViewOrder(order)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Đơn hàng</Text>
            <Text style={styles.orderId}>#{order.Id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {order.Status}
            </Text>
          </View>
        </View>

        {/* Order info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderInfoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
            <Text style={styles.orderInfoText}>{formatDate(order.OrderDate)}</Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Ionicons name="location-outline" size={16} color={colors.textLight} />
            <Text style={styles.orderInfoText} numberOfLines={1}>
              {order.ShippingAddress || 'Chưa có địa chỉ'}
            </Text>
          </View>
        </View>

        {/* Order items preview */}
        {order.OrderDetails && order.OrderDetails.length > 0 && (
          <View style={styles.orderItems}>
            <Text style={styles.orderItemsText}>
              {order.OrderDetails.length} sản phẩm
            </Text>
            <Text style={styles.orderItemsPreview} numberOfLines={1}>
              {order.OrderDetails.map(item => item.ProductName).join(', ')}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.TotalAmount)}</Text>
          </View>
          
          <View style={styles.orderActions}>
            {order.Status === 'Mới' && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(order)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.detailButton}
              onPress={() => handleViewOrder(order)}
            >
              <Text style={styles.detailButtonText}>Chi tiết</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={60} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!
      </Text>
      <TouchableOpacity 
        style={styles.shopNowButton}
        onPress={() => navigation?.navigate?.('Home')}
      >
        <Text style={styles.shopNowButtonText}>Mua sắm ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.key && styles.tabTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.Id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  
  // Tabs
  tabsWrapper: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  
  // List
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  
  // Order Card
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Order Info
  orderInfo: {
    marginBottom: 12,
    gap: 6,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  
  // Order Items
  orderItems: {
    backgroundColor: colors.gray50,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  orderItemsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderItemsPreview: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Order Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.accent,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
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
});

export default OrdersScreen;
