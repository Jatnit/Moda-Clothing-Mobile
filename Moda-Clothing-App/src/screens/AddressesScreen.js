import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, shadows } from '../theme/colors';
import api from '../config/api';

// Vietnam Provinces API
const PROVINCES_API = 'https://esgoo.net/api-tinhthanh';

const AddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    cityCode: '',
    district: '',
    districtCode: '',
    ward: '',
    wardCode: '',
    isDefault: false,
  });

  // Provinces data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  // Picker modals
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showWardPicker, setShowWardPicker] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      console.log('📍 Addresses response:', response.data);
      
      // Response có thể là {success: true, data: [...]} hoặc trực tiếp [...]
      if (response.data?.success && response.data?.data) {
        setAddresses(response.data.data);
      } else if (Array.isArray(response.data)) {
        setAddresses(response.data);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.log('Fetch addresses error:', error.message);
      if (error.response?.status === 401) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để xem địa chỉ');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch provinces
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await fetch(`${PROVINCES_API}/1/0.htm`);
      const data = await response.json();
      if (data.error === 0) {
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

  // Fetch districts
  const fetchDistricts = async (provinceCode) => {
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
    }
  };

  // Fetch wards
  const fetchWards = async (districtCode) => {
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
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Open add modal
  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      city: '',
      cityCode: '',
      district: '',
      districtCode: '',
      ward: '',
      wardCode: '',
      isDefault: addresses.length === 0,
    });
    setDistricts([]);
    setWards([]);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      name: address.RecipientName || '',
      phone: address.PhoneNumber || '',
      address: address.AddressLine || '',
      city: address.City || '',
      cityCode: '',
      district: address.District || '',
      districtCode: '',
      ward: address.Ward || '',
      wardCode: '',
      isDefault: address.IsDefault || false,
    });
    setShowModal(true);
  };

  // Save address
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ tên');
      return;
    }
    if (!formData.phone.trim() || !/^[0-9]{10,11}$/.test(formData.phone)) {
      Alert.alert('Thông báo', 'Số điện thoại không hợp lệ');
      return;
    }
    if (!formData.city) {
      Alert.alert('Thông báo', 'Vui lòng chọn Tỉnh/Thành phố');
      return;
    }
    if (!formData.district) {
      Alert.alert('Thông báo', 'Vui lòng chọn Quận/Huyện');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    setSaving(true);
    try {
      // Sử dụng đúng tên field theo backend API
      const addressData = {
        recipientName: formData.name,
        phoneNumber: formData.phone,
        addressLine: formData.address,
        city: formData.city,
        district: formData.district,
        ward: formData.ward || '',
        isDefault: formData.isDefault,
      };

      console.log('📤 Sending address data:', JSON.stringify(addressData, null, 2));

      // API interceptor đã unwrap response.data, nên result là data trực tiếp
      let result;
      if (editingAddress) {
        result = await api.put(`/addresses/${editingAddress.Id}`, addressData);
      } else {
        result = await api.post('/addresses', addressData);
      }

      console.log('📥 Result:', result);

      // Nếu không có error (không rơi vào catch), coi như thành công
      Alert.alert('Thành công', editingAddress ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới');
      setShowModal(false);
      fetchAddresses();
    } catch (error) {
      console.error('Save address error:', error);
      const errorMessage = error?.errors?.[0]?.msg 
        || error?.message 
        || 'Không thể lưu địa chỉ';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Delete address
  const handleDelete = (address) => {
    Alert.alert(
      'Xóa địa chỉ',
      `Bạn có chắc muốn xóa địa chỉ của "${address.RecipientName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting address:', address.Id);
              // API interceptor đã unwrap response.data, nên result là data trực tiếp
              const result = await api.delete(`/addresses/${address.Id}`);
              console.log('📥 Delete result:', result);
              
              // result có thể là {success: true} hoặc undefined (khi không có body)
              // Nếu không có error, coi như thành công
              Alert.alert('Thành công', 'Đã xóa địa chỉ');
              fetchAddresses();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Lỗi', error?.message || 'Không thể xóa địa chỉ');
            }
          },
        },
      ]
    );
  };

  // Set as default
  const handleSetDefault = async (address) => {
    try {
      console.log('⭐ Setting default address:', address.Id);
      // API interceptor đã unwrap response.data
      const result = await api.put(`/addresses/${address.Id}/default`);
      console.log('📥 Set default result:', result);
      
      // Nếu không có error, coi như thành công
      Alert.alert('Thành công', 'Đã đặt làm địa chỉ mặc định');
      fetchAddresses();
    } catch (error) {
      console.error('Set default error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể đặt làm mặc định');
    }
  };

  // Render address card
  const renderAddress = ({ item }) => (
    <View style={[styles.addressCard, item.IsDefault && styles.addressCardDefault]}>
      {item.IsDefault ? (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Mặc định</Text>
        </View>
      ) : null}
      
      <View style={styles.addressHeader}>
        <View style={styles.addressNameRow}>
          <Ionicons name="person" size={16} color={colors.accent} />
          <Text style={styles.addressName}>{item.RecipientName || 'Chưa có tên'}</Text>
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="call" size={14} color={colors.textLight} />
        <Text style={styles.addressPhone}>{item.PhoneNumber || ''}</Text>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location" size={14} color={colors.textLight} />
        <Text style={styles.addressText}>
          {[item.AddressLine, item.Ward, item.District, item.City].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
        </Text>
      </View>

      {!item.IsDefault ? (
        <TouchableOpacity 
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(item)}
        >
          <Text style={styles.setDefaultText}>Đặt làm mặc định</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // Render picker modal
  const renderPickerModal = (visible, onClose, data, onSelect, title) => {
    const filteredData = searchText
      ? data.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
      : data;

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearch}>
              <Ionicons name="search" size={18} color={colors.textLight} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Tìm kiếm..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.code?.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSearchText('');
                    onSelect(item);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // Render form modal
  const renderFormModal = () => (
    <Modal visible={showModal} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Họ tên *</Text>
              <View style={styles.formInputRow}>
                <Ionicons name="person" size={18} color={colors.textLight} />
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập họ tên"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số điện thoại *</Text>
              <View style={styles.formInputRow}>
                <Ionicons name="call" size={18} color={colors.textLight} />
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                />
              </View>
            </View>

            {/* Province */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tỉnh/Thành phố *</Text>
              <TouchableOpacity 
                style={styles.formPicker}
                onPress={() => setShowProvincePicker(true)}
              >
                <Ionicons name="business" size={18} color={colors.textLight} />
                <Text style={[styles.formPickerText, formData.city && styles.formPickerTextFilled]}>
                  {formData.city || 'Chọn Tỉnh/Thành phố'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* District */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quận/Huyện *</Text>
              <TouchableOpacity 
                style={[styles.formPicker, !formData.city && styles.formPickerDisabled]}
                onPress={() => formData.city && setShowDistrictPicker(true)}
              >
                <Ionicons name="map" size={18} color={colors.textLight} />
                <Text style={[styles.formPickerText, formData.district && styles.formPickerTextFilled]}>
                  {formData.district || 'Chọn Quận/Huyện'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Ward */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phường/Xã</Text>
              <TouchableOpacity 
                style={[styles.formPicker, !formData.district && styles.formPickerDisabled]}
                onPress={() => formData.district && setShowWardPicker(true)}
              >
                <Ionicons name="navigate" size={18} color={colors.textLight} />
                <Text style={[styles.formPickerText, formData.ward && styles.formPickerTextFilled]}>
                  {formData.ward || 'Chọn Phường/Xã'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Địa chỉ chi tiết *</Text>
              <View style={styles.formInputRow}>
                <Ionicons name="home" size={18} color={colors.textLight} />
                <TextInput
                  style={styles.formInput}
                  placeholder="Số nhà, tên đường..."
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                />
              </View>
            </View>

            {/* Default checkbox */}
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setFormData({...formData, isDefault: !formData.isDefault})}
            >
              <Ionicons 
                name={formData.isDefault ? 'checkbox' : 'square-outline'} 
                size={22} 
                color={formData.isDefault ? colors.accent : colors.textLight} 
              />
              <Text style={styles.checkboxText}>Đặt làm địa chỉ mặc định</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Province Picker */}
      {renderPickerModal(
        showProvincePicker,
        () => { setShowProvincePicker(false); setSearchText(''); },
        provinces,
        (item) => {
          setFormData({
            ...formData,
            city: item.name,
            cityCode: item.code,
            district: '',
            districtCode: '',
            ward: '',
            wardCode: '',
          });
          setDistricts([]);
          setWards([]);
          setShowProvincePicker(false);
          fetchDistricts(item.code);
        },
        'Chọn Tỉnh/Thành phố'
      )}

      {/* District Picker */}
      {renderPickerModal(
        showDistrictPicker,
        () => { setShowDistrictPicker(false); setSearchText(''); },
        districts,
        (item) => {
          setFormData({
            ...formData,
            district: item.name,
            districtCode: item.code,
            ward: '',
            wardCode: '',
          });
          setWards([]);
          setShowDistrictPicker(false);
          fetchWards(item.code);
        },
        'Chọn Quận/Huyện'
      )}

      {/* Ward Picker */}
      {renderPickerModal(
        showWardPicker,
        () => { setShowWardPicker(false); setSearchText(''); },
        wards,
        (item) => {
          setFormData({
            ...formData,
            ward: item.name,
            wardCode: item.code,
          });
          setShowWardPicker(false);
        },
        'Chọn Phường/Xã'
      )}
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Đang tải...</Text>
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
        <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Address List */}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.Id?.toString()}
        renderItem={renderAddress}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={50} color={colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptySubtitle}>Thêm địa chỉ giao hàng để đặt hàng nhanh hơn</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Form Modal */}
      {renderFormModal()}
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Address Card
  addressCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  addressCardDefault: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  defaultBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  addressPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  setDefaultButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  setDefaultText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
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
    maxHeight: '90%',
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
  modalBody: {
    padding: 16,
  },

  // Form
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  formInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  formPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formPickerDisabled: {
    backgroundColor: colors.gray100,
  },
  formPickerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.textLight,
  },
  formPickerTextFilled: {
    color: colors.textPrimary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.accent,
    margin: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.medium,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  pickerSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 14,
  },
  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});

export default AddressesScreen;
