import React, { useState, useEffect } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { colors, shadows } from '../theme/colors';
import orderService from '../services/orderService';
import cartService from '../services/cartService';

// Vietnam Provinces API (esgoo.net)
const PROVINCES_API = 'https://esgoo.net/api-tinhthanh';

const CheckoutScreen = ({ navigation, route }) => {
  const { items = [], total = 0 } = route?.params || {};
  
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    cityCode: '',
    district: '',
    districtCode: '',
    ward: '',
    wardCode: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Provinces data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Modal states
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const paymentMethods = [
    { id: 'COD', label: 'Thanh toán khi nhận hàng', icon: 'cash-outline' },
    { id: 'Banking', label: 'Chuyển khoản ngân hàng', icon: 'card-outline' },
    { id: 'MOMO', label: 'Ví MoMo', icon: 'wallet-outline' },
    { id: 'VNPAY', label: 'VNPay', icon: 'phone-portrait-outline' },
  ];

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch provinces (Tỉnh/Thành phố)
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await fetch(`${PROVINCES_API}/1/0.htm`);
      const data = await response.json();
      if (data.error === 0) {
        // Map to standard format
        const mapped = data.data.map(p => ({
          code: p.id,
          name: p.full_name || p.name,
        }));
        setProvinces(mapped);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Fetch districts (Quận/Huyện) when province changes
  const fetchDistricts = async (provinceCode) => {
    setLoadingDistricts(true);
    try {
      const response = await fetch(`${PROVINCES_API}/2/${provinceCode}.htm`);
      const data = await response.json();
      if (data.error === 0) {
        const mapped = data.data.map(d => ({
          code: d.id,
          name: d.full_name || d.name,
        }));
        setDistricts(mapped);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch wards (Phường/Xã) when district changes
  const fetchWards = async (districtCode) => {
    setLoadingWards(true);
    try {
      const response = await fetch(`${PROVINCES_API}/3/${districtCode}.htm`);
      const data = await response.json();
      if (data.error === 0) {
        const mapped = data.data.map(w => ({
          code: w.id,
          name: w.full_name || w.name,
        }));
        setWards(mapped);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    } finally {
      setLoadingWards(false);
    }
  };

  // Handle province select
  const handleProvinceSelect = (province) => {
    setShippingInfo({
      ...shippingInfo,
      city: province.name,
      cityCode: province.code,
      district: '',
      districtCode: '',
      ward: '',
      wardCode: '',
    });
    setDistricts([]);
    setWards([]);
    setShowProvinceModal(false);
    fetchDistricts(province.code);
  };

  // Handle district select
  const handleDistrictSelect = (district) => {
    setShippingInfo({
      ...shippingInfo,
      district: district.name,
      districtCode: district.code,
      ward: '',
      wardCode: '',
    });
    setWards([]);
    setShowDistrictModal(false);
    fetchWards(district.code);
  };

  // Handle ward select
  const handleWardSelect = (ward) => {
    setShippingInfo({
      ...shippingInfo,
      ward: ward.name,
      wardCode: ward.code,
    });
    setShowWardModal(false);
  };

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
    if (!shippingInfo.city) {
      Alert.alert('Thông báo', 'Vui lòng chọn Tỉnh/Thành phố');
      return false;
    }
    if (!shippingInfo.district) {
      Alert.alert('Thông báo', 'Vui lòng chọn Quận/Huyện');
      return false;
    }
    return true;
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    // Validate items have skuId
    const invalidItems = items.filter(item => !item.skuId);
    if (invalidItems.length > 0) {
      Alert.alert('Lỗi', 'Một số sản phẩm không có thông tin SKU. Vui lòng quay lại giỏ hàng và thử lại.');
      return;
    }

    setLoading(true);
    try {
      // Build full address
      const fullAddress = [
        shippingInfo.address,
        shippingInfo.ward,
        shippingInfo.district,
        shippingInfo.city,
      ].filter(Boolean).join(', ');

      const orderData = {
        items: items.map(item => ({
          skuId: item.skuId,
          quantity: item.quantity,
        })),
        shippingName: shippingInfo.name,
        shippingPhone: shippingInfo.phone,
        shippingAddress: fullAddress,
        paymentMethod,
        note: shippingInfo.note,
      };

      console.log('📦 Creating order with data:', JSON.stringify(orderData, null, 2));

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        // Clear cart after successful order
        try {
          await cartService.clearCart();
        } catch (e) {
          console.log('Clear cart error:', e);
        }

        Alert.alert(
          '🎉 Đặt hàng thành công!',
          `Đơn hàng #${response.data?.Id || ''} đã được tạo.\nChúng tôi sẽ sớm liên hệ với bạn.`,
          [
            {
              text: 'Xem đơn hàng',
              onPress: () => {
                // Reset stack để khi back sẽ về Home thay vì Checkout
                navigation?.dispatch(
                  CommonActions.reset({
                    index: 1,
                    routes: [
                      { name: 'Home' },
                      { name: 'Orders' },
                    ],
                  })
                );
              },
            },
            {
              text: 'Về trang chủ',
              style: 'cancel',
              onPress: () => {
                // Reset về Home
                navigation?.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                );
              },
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

  // Render picker modal
  const renderPickerModal = (visible, onClose, data, onSelect, title, loadingData) => {
    const filteredData = searchText
      ? data.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
      : data;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.modalSearch}>
              <Ionicons name="search-outline" size={20} color={colors.textLight} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Tìm kiếm..."
                placeholderTextColor={colors.textLight}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textLight} />
                </TouchableOpacity>
              ) : null}
            </View>

            {loadingData ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.modalLoadingText}>Đang tải...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.code?.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSearchText('');
                      onSelect(item);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>Không tìm thấy kết quả</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

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
              {/* Họ tên */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} /> Họ tên người nhận *
                </Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="person" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputIconField}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={colors.textLight}
                    value={shippingInfo.name}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, name: text})}
                  />
                </View>
              </View>

              {/* Số điện thoại */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} /> Số điện thoại *
                </Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="call" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputIconField}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={colors.textLight}
                    keyboardType="phone-pad"
                    value={shippingInfo.phone}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                  />
                </View>
              </View>

              {/* Province Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="business-outline" size={14} color={colors.textSecondary} /> Tỉnh/Thành phố *
                </Text>
                <TouchableOpacity
                  style={styles.pickerWithIcon}
                  onPress={() => setShowProvinceModal(true)}
                >
                  <Ionicons name="business" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <Text style={[styles.pickerIconText, shippingInfo.city ? styles.pickerTextFilled : null]}>
                    {shippingInfo.city || 'Chọn Tỉnh/Thành phố'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* District Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="map-outline" size={14} color={colors.textSecondary} /> Quận/Huyện *
                </Text>
                <TouchableOpacity
                  style={[styles.pickerWithIcon, !shippingInfo.city && styles.pickerDisabled]}
                  onPress={() => shippingInfo.city && setShowDistrictModal(true)}
                  disabled={!shippingInfo.city}
                >
                  <Ionicons name="map" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <Text style={[styles.pickerIconText, shippingInfo.district ? styles.pickerTextFilled : null]}>
                    {shippingInfo.district || 'Chọn Quận/Huyện'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* Ward Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} /> Phường/Xã
                </Text>
                <TouchableOpacity
                  style={[styles.pickerWithIcon, !shippingInfo.district && styles.pickerDisabled]}
                  onPress={() => shippingInfo.district && setShowWardModal(true)}
                  disabled={!shippingInfo.district}
                >
                  <Ionicons name="navigate" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <Text style={[styles.pickerIconText, shippingInfo.ward ? styles.pickerTextFilled : null]}>
                    {shippingInfo.ward || 'Chọn Phường/Xã'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* Địa chỉ chi tiết */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="home-outline" size={14} color={colors.textSecondary} /> Địa chỉ chi tiết *
                </Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="home" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputIconField}
                    placeholder="Số nhà, tên đường..."
                    placeholderTextColor={colors.textLight}
                    value={shippingInfo.address}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
                  />
                </View>
              </View>

              {/* Ghi chú */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} /> Ghi chú
                </Text>
                <View style={[styles.inputWithIcon, styles.inputWithIconMultiline]}>
                  <Ionicons name="chatbubble" size={18} color={colors.textLight} style={[styles.inputIcon, { marginTop: 12 }]} />
                  <TextInput
                    style={[styles.inputIconField, styles.inputMultiline]}
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

      {/* Province Modal */}
      {renderPickerModal(
        showProvinceModal,
        () => { setShowProvinceModal(false); setSearchText(''); },
        provinces,
        handleProvinceSelect,
        'Chọn Tỉnh/Thành phố',
        loadingProvinces
      )}

      {/* District Modal */}
      {renderPickerModal(
        showDistrictModal,
        () => { setShowDistrictModal(false); setSearchText(''); },
        districts,
        handleDistrictSelect,
        'Chọn Quận/Huyện',
        loadingDistricts
      )}

      {/* Ward Modal */}
      {renderPickerModal(
        showWardModal,
        () => { setShowWardModal(false); setSearchText(''); },
        wards,
        handleWardSelect,
        'Chọn Phường/Xã',
        loadingWards
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
  picker: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerDisabled: {
    backgroundColor: colors.gray100,
  },
  pickerText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: colors.textLight,
  },
  
  // Input with Icon styles
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWithIconMultiline: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  inputIconField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  pickerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerIconText: {
    flex: 1,
    fontSize: 15,
    color: colors.textLight,
  },
  pickerTextFilled: {
    color: colors.textPrimary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    margin: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: colors.textSecondary,
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
