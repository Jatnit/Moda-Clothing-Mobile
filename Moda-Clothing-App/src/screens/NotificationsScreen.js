import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'order',
    title: 'Đơn hàng đã được giao',
    message: 'Đơn hàng #1234 của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!',
    time: '2 giờ trước',
    read: false,
    icon: 'checkmark-circle',
    color: '#10b981',
  },
  {
    id: 2,
    type: 'promo',
    title: 'Flash Sale - Giảm 50%! 🔥',
    message: 'Chỉ hôm nay! Giảm 50% cho tất cả áo thun. Đừng bỏ lỡ!',
    time: '5 giờ trước',
    read: false,
    icon: 'pricetag',
    color: '#f59e0b',
  },
  {
    id: 3,
    type: 'order',
    title: 'Đơn hàng đang giao',
    message: 'Đơn hàng #1233 của bạn đang trên đường giao. Dự kiến giao trong hôm nay.',
    time: '1 ngày trước',
    read: true,
    icon: 'bicycle',
    color: '#8b5cf6',
  },
  {
    id: 4,
    type: 'system',
    title: 'Chào mừng đến MODA!',
    message: 'Chào mừng bạn đến với MODA Clothing. Khám phá hàng ngàn sản phẩm thời trang!',
    time: '3 ngày trước',
    read: true,
    icon: 'gift',
    color: '#3b82f6',
  },
  {
    id: 5,
    type: 'promo',
    title: 'Ưu đãi sinh nhật 🎂',
    message: 'Nhân dịp sinh nhật, tặng bạn mã giảm giá 20% cho đơn hàng tiếp theo!',
    time: '1 tuần trước',
    read: true,
    icon: 'gift',
    color: '#ec4899',
  },
];

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Mark as read
  const markAsRead = (notificationId) => {
    setNotifications(items =>
      items.map(item =>
        item.id === notificationId ? { ...item, read: true } : item
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(items =>
      items.map(item => ({ ...item, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(items =>
      items.filter(item => item.id !== notificationId)
    );
  };

  // Count unread
  const unreadCount = notifications.filter(n => !n.read).length;

  // Render notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.notificationItemUnread,
      ]}
      onPress={() => {
        markAsRead(item.id);
        // Navigate based on type
        if (item.type === 'order') {
          // navigation?.navigate?.('Orders');
          console.log('Go to orders');
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
      >
        <Ionicons name="close" size={18} color={colors.textLight} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off-outline" size={60} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Không có thông báo</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có thông báo nào. Chúng tôi sẽ thông báo khi có tin mới!
      </Text>
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
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Ionicons name="mail-unread-outline" size={16} color={colors.accent} />
          <Text style={styles.unreadText}>
            Bạn có {unreadCount} thông báo chưa đọc
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
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
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },

  // Unread Badge
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent + '15',
    paddingVertical: 10,
    gap: 8,
  },
  unreadText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },

  // List
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...shadows.small,
  },
  notificationItemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
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
  },
});

export default NotificationsScreen;
