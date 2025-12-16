import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import authService from '../services/authService';

const ProfileScreen = ({ navigation, user, onUserUpdate, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.FullName || '',
    phone: user?.PhoneNumber || '',
    email: user?.Email || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.FullName || '',
        phone: user.PhoneNumber || '',
        email: user.Email || '',
      });
    }
  }, [user]);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updateProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });

      if (response.success) {
        onUserUpdate?.(response.data.user);
        setEditing(false);
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
      } else {
        Alert.alert('Lỗi', response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            onLogout?.();
            navigation?.navigate?.('Home');
          }
        },
      ]
    );
  };

  // Menu items
  const menuItems = [
    {
      icon: 'receipt-outline',
      label: 'Đơn hàng của tôi',
      onPress: () => navigation?.navigate?.('Orders'),
      badge: null,
    },
    {
      icon: 'location-outline',
      label: 'Địa chỉ giao hàng',
      onPress: () => console.log('Addresses'),
      badge: null,
    },
    {
      icon: 'heart-outline',
      label: 'Sản phẩm yêu thích',
      onPress: () => console.log('Wishlist'),
      badge: null,
    },
    {
      icon: 'card-outline',
      label: 'Phương thức thanh toán',
      onPress: () => console.log('Payment'),
      badge: null,
    },
    {
      icon: 'notifications-outline',
      label: 'Thông báo',
      onPress: () => console.log('Notifications'),
      badge: '3',
    },
    {
      icon: 'settings-outline',
      label: 'Cài đặt',
      onPress: () => console.log('Settings'),
      badge: null,
    },
    {
      icon: 'help-circle-outline',
      label: 'Trợ giúp & Hỗ trợ',
      onPress: () => console.log('Help'),
      badge: null,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => editing ? handleSaveProfile() : setEditing(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.editButtonText}>
              {editing ? 'Lưu' : 'Sửa'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.AvatarUrl ? (
              <Image source={{ uri: user.AvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(user?.FullName || user?.Username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {editing && (
              <TouchableOpacity style={styles.changeAvatarButton}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            // Editing mode
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholder="Nhập họ và tên"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formData.email}
                  editable={false}
                />
                <Text style={styles.inputHint}>Email không thể thay đổi</Text>
              </View>
            </View>
          ) : (
            // View mode
            <>
              <Text style={styles.profileName}>{user?.FullName || user?.Username}</Text>
              <Text style={styles.profileEmail}>{user?.Email}</Text>
              {user?.PhoneNumber && (
                <View style={styles.phoneContainer}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.profilePhone}>{user.PhoneNumber}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>

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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: colors.background,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Edit Form
  editForm: {
    width: '100%',
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: colors.gray200,
    color: colors.textLight,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Statistics
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  
  // Menu
  menuContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
    ...shadows.small,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  
  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textLight,
    marginTop: 20,
  },
});

export default ProfileScreen;
