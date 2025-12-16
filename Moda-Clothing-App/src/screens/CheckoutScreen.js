import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import orderService from '../services/orderService';

const CheckoutScreen = ({ navigation, route }) => {
  const { items = [], total = 0 } = route?.params || {};
  
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const paymentMethods = [
    { id: 'COD', label: 'Thanh toán khi nhận hàng', icon: 'cash-outline' },
    { id: 'Banking', label: 'Chuyển khoản ngân hàng', icon: 'card-outline' },
    { id: 'MOMO', label: 'Ví MoMo', icon: 'wallet-outline' },
    { id: 'VNPAY', label: 'VNPay', icon: 'phone-portrait-outline' },
  ];

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 0; // Free shipping
  const grandTotal = subtotal + shippingFee;

  // Validate form
  const validateForm = () => {
    if (!shippingInfo.name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ tên người nhận');
      return false;
    }
    if (!shippingInfo.phone.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại');
      return false;
    }
    if (!/^[0-9]{10,11}$/.test(shippingInfo.phone)) {
      Alert.alert('Thông báo', 'Số điện thoại không hợp lệ');
      return false;
    }
    if (!shippingInfo.address.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ giao hàng');
      return false;
    }
    return true;
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productSkuId: item.skuId,
          quantity: item.quantity,
          unitPrice: item.price,
          productName: item.name,
          color: item.color?.Value,
          size: item.size?.Value,
        })),
        shippingName: shippingInfo.name,
        shippingPhone: shippingInfo.phone,
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.city}`.replace(/^, |, $/g, '').replace(/, ,/g, ','),
        paymentMethod,
        note: shippingInfo.note,
        totalAmount: grandTotal,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        Alert.alert(
          '🎉 Đặt hàng thành công!',
          `Đơn hàng #${response.data?.Id || ''} đã được tạo.\nChúng tôi sẽ sớm liên hệ với bạn.`,
          [
            {
              text: 'Xem đơn hàng',
              onPress: () => navigation?.navigate?.('Orders'),
            },
            {
              text: 'Về trang chủ',
              style: 'cancel',
              onPress: () => navigation?.navigate?.('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Create order error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Render order item
  const renderOrderItem = (item, index) => (
    <View key={index} style={styles.orderItem}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder}>
          <Ionicons name="shirt-outline" size={24} color={colors.textLight} />
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemVariant}>
          {item.color?.Value} | {item.size?.Value}
        </Text>
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="cart-outline" size={18} /> Sản phẩm ({items.length})
            </Text>
            <View style={styles.itemsCard}>
              {items.map((item, index) => renderOrderItem(item, index))}
            </View>
          </View>

          {/* Shipping Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="location-outline" size={18} /> Thông tin giao hàng
            </Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ tên người nhận *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={colors.textLight}
                  value={shippingInfo.name}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={colors.textLight}
                  keyboardType="phone-pad"
                  value={shippingInfo.phone}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Số nhà, tên đường"
                  placeholderTextColor={colors.textLight}
                  value={shippingInfo.address}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Tỉnh/Thành phố</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Thành phố"
                    placeholderTextColor={colors.textLight}
                    value={shippingInfo.city}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, city: text})}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quận/Huyện</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Quận/Huyện"
                    placeholderTextColor={colors.textLight}
                    value={shippingInfo.district}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, district: text})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={3}
                  value={shippingInfo.note}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, note: text})}
                />
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="card-outline" size={18} /> Phương thức thanh toán
            </Text>
            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    paymentMethod === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <View style={styles.paymentMethodLeft}>
                    <View style={[
                      styles.paymentMethodIcon,
                      paymentMethod === method.id && styles.paymentMethodIconSelected,
                    ]}>
                      <Ionicons 
                        name={method.icon} 
                        size={20} 
                        color={paymentMethod === method.id ? colors.white : colors.textSecondary} 
                      />
                    </View>
                    <Text style={[
                      styles.paymentMethodLabel,
                      paymentMethod === method.id && styles.paymentMethodLabelSelected,
                    ]}>
                      {method.label}
                    </Text>
                  </View>
                  <View style={[
                    styles.paymentRadio,
                    paymentMethod === method.id && styles.paymentRadioSelected,
                  ]}>
                    {paymentMethod === method.id && (
                      <View style={styles.paymentRadioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Chi tiết thanh toán</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={styles.summaryValueFree}>Miễn phí</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalInfoLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalInfoValue}>{formatPrice(grandTotal)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Đặt hàng</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
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

  scrollContent: {
    paddingBottom: 20,
  },

  // Section
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

  // Items
  itemsCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 8,
  },
  orderItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemVariant: {
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

  // Form
  formCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Payment
  paymentMethods: {
    gap: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodIconSelected: {
    backgroundColor: colors.accent,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  paymentMethodLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentRadioSelected: {
    borderColor: colors.accent,
  },
  paymentRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.background,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    ...shadows.small,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  summaryValueFree: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  summaryDivider: {
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

  // Bottom Action
  bottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 30,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  totalInfo: {
    flex: 1,
  },
  totalInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  totalInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  placeOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    gap: 8,
    ...shadows.medium,
  },
  placeOrderButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CheckoutScreen;
