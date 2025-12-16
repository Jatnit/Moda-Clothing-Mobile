import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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

// Timeline steps
const TIMELINE_STEPS = [
  { status: 'Mới', label: 'Đặt hàng', icon: 'cart-outline' },
  { status: 'Đang xử lý', label: 'Xử lý', icon: 'cube-outline' },
  { status: 'Đang giao', label: 'Giao hàng', icon: 'bicycle-outline' },
  { status: 'Hoàn thành', label: 'Hoàn thành', icon: 'checkmark-circle-outline' },
];

const OrderDetailScreen = ({ navigation, route }) => {
  const { orderId, order: initialOrder } = route?.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = orderId || initialOrder?.Id;
    if (id) {
      fetchOrderDetail(id);
    } else {
      setLoading(false);
    }
  }, [orderId, initialOrder?.Id]);

  const fetchOrderDetail = async (id) => {
    try {
      const response = await orderService.getOrderDetail(id);
      console.log('📦 Order detail response:', JSON.stringify(response, null, 2).slice(0, 500));
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Orders');
    }
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    if (order?.Status !== 'Mới') {
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
                Alert.alert('Thành công', 'Đơn hàng đã được hủy', [
                  { text: 'OK', onPress: handleGoBack }
                ]);
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
    }).format(price || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get current step index
  const getCurrentStepIndex = () => {
    if (order?.Status === 'Đã hủy') return -1;
    return TIMELINE_STEPS.findIndex(step => step.status === order?.Status);
  };

  // Render timeline
  const renderTimeline = () => {
    const currentStep = getCurrentStepIndex();
    
    if (order?.Status === 'Đã hủy') {
      return (
        <View style={styles.cancelledBanner}>
          <Ionicons name="close-circle" size={24} color={colors.error} />
          <Text style={styles.cancelledText}>Đơn hàng đã bị hủy</Text>
        </View>
      );
    }

    return (
      <View style={styles.timeline}>
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <View key={step.status} style={styles.timelineStep}>
              <View style={styles.timelineIconWrapper}>
                <View style={[
                  styles.timelineIcon,
                  isCompleted && styles.timelineIconCompleted,
                  isCurrent && styles.timelineIconCurrent,
                ]}>
                  <Ionicons 
                    name={step.icon} 
                    size={20} 
                    color={isCompleted ? colors.white : colors.textLight} 
                  />
                </View>
                {index < TIMELINE_STEPS.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    isCompleted && styles.timelineLineCompleted,
                  ]} />
                )}
              </View>
              <Text style={[
                styles.timelineLabel,
                isCompleted && styles.timelineLabelCompleted,
              ]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.textLight} />
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[order.Status] || STATUS_CONFIG['Mới'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng #{order.Id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {order.Status}
            </Text>
          </View>
          <Text style={styles.orderDate}>Đặt ngày: {formatDate(order.OrderDate)}</Text>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
          {renderTimeline()}
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Người nhận:</Text>
              <Text style={styles.infoValue}>{order.ShippingName || 'Chưa có'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoValue}>{order.ShippingPhone || 'Chưa có'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              <Text style={[styles.infoValue, { flex: 1 }]}>
                {order.ShippingAddress || 'Chưa có'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Sản phẩm ({order.OrderDetails?.length || 0})
          </Text>
          <View style={styles.itemsCard}>
            {order.OrderDetails?.map((item, index) => (
              <View 
                key={item.Id || index} 
                style={[
                  styles.orderItem,
                  index < order.OrderDetails.length - 1 && styles.orderItemBorder
                ]}
              >
                {item.ThumbnailUrl ? (
                  <Image 
                    source={{ uri: item.ThumbnailUrl }} 
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={28} color={colors.textLight} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.ProductName || 'Sản phẩm'}
                  </Text>
                  <View style={styles.itemVariant}>
                    {item.Color && (
                      <Text style={styles.variantText}>Màu: {item.Color}</Text>
                    )}
                    {item.Size && (
                      <Text style={styles.variantText}>Size: {item.Size}</Text>
                    )}
                  </View>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{formatPrice(item.UnitPrice)}</Text>
                    <Text style={styles.itemQuantity}>x{item.Quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Phương thức:</Text>
              <Text style={styles.infoValue}>{order.PaymentMethod || 'COD'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <Text style={[
                styles.infoValue,
                { color: order.IsPaid ? colors.success : colors.warning }
              ]}>
                {order.IsPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.TotalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{formatPrice(0)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(order.TotalAmount)}</Text>
          </View>
        </View>

        {/* Note */}
        {order.Note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{order.Note}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {order.Status === 'Mới' && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
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

  // Status Card
  statusCard: {
    backgroundColor: colors.background,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Timeline
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineIconCompleted: {
    backgroundColor: colors.success,
  },
  timelineIconCurrent: {
    backgroundColor: colors.accent,
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 3,
    backgroundColor: colors.gray200,
    top: 18,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  timelineLabelCompleted: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  cancelledText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Items Card
  itemsCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 4,
  },
  orderItem: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  itemImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemVariant: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  variantText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.background,
    padding: 16,
    marginBottom: 12,
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
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },

  // Note
  noteCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 14,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Actions
  actions: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});

export default OrderDetailScreen;
