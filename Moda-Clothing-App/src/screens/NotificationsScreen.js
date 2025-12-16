import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, shadows } from '../theme/colors';
import reviewService from '../services/reviewService';

// Static notifications
const STATIC_NOTIFICATIONS = [
  {
    id: 'promo-1',
    type: 'promo',
    title: 'Flash Sale - Giảm 50%! 🔥',
    message: 'Chỉ hôm nay! Giảm 50% cho tất cả áo thun. Đừng bỏ lỡ!',
    time: '5 giờ trước',
    read: false,
    icon: 'pricetag',
    color: '#f59e0b',
  },
  {
    id: 'system-1',
    type: 'system',
    title: 'Chào mừng đến MODA!',
    message: 'Chào mừng bạn đến với MODA Clothing. Khám phá hàng ngàn sản phẩm thời trang!',
    time: '3 ngày trước',
    read: true,
    icon: 'gift',
    color: '#3b82f6',
  },
];

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(STATIC_NOTIFICATIONS);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending reviews count
  const fetchPendingReviews = async () => {
    try {
      const response = await reviewService.getPendingReviews();
      if (response.success) {
        const orders = response.data?.orders || [];
        const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
        setPendingReviewsCount(totalItems);

        // Create review notifications for each order
        const reviewNotifications = orders.map(order => ({
          id: `review-${order.orderId}`,
          type: 'review',
          title: 'Đánh giá sản phẩm ⭐',
          message: `Đơn hàng #${order.orderCode} đã được giao. Hãy đánh giá ${order.items.length} sản phẩm trong ${order.daysLeft} ngày!`,
          time: formatTimeAgo(order.completedAt),
          read: false,
          icon: 'star',
          color: '#fbbf24',
          orderId: order.orderId,
          daysLeft: order.daysLeft,
        }));

        // Combine with static notifications
        setNotifications([...reviewNotifications, ...STATIC_NOTIFICATIONS]);
      }
    } catch (error) {
      console.log('Fetch pending reviews skipped:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    if (diffMinutes > 0) return `${diffMinutes} phút trước`;
    return 'Vừa xong';
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPendingReviews();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingReviews();
  }, []);

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

  // Handle notification press
  const handleNotificationPress = (item) => {
    markAsRead(item.id);
    
    if (item.type === 'review') {
      // Navigate to Reviews screen
      navigation?.navigate?.('Reviews');
    } else if (item.type === 'order') {
      navigation?.navigate?.('Orders');
    }
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
      onPress={() => handleNotificationPress(item)}
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
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{item.time}</Text>
          {item.type === 'review' && item.daysLeft && (
            <View style={styles.daysLeftBadge}>
              <Ionicons name="time-outline" size={10} color="#D97706" />
              <Text style={styles.daysLeftText}>Còn {item.daysLeft} ngày</Text>
            </View>
          )}
        </View>
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

      {/* Pending Reviews Banner */}
      {pendingReviewsCount > 0 && (
        <TouchableOpacity 
          style={styles.reviewBanner}
          onPress={() => navigation?.navigate?.('Reviews')}
        >
          <View style={styles.reviewBannerIcon}>
            <Ionicons name="star" size={20} color="#fbbf24" />
          </View>
          <View style={styles.reviewBannerContent}>
            <Text style={styles.reviewBannerTitle}>
              Bạn có {pendingReviewsCount} sản phẩm chờ đánh giá
            </Text>
            <Text style={styles.reviewBannerSubtitle}>
              Đánh giá ngay để nhận điểm thưởng!
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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

  // Review Banner
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    ...shadows.small,
  },
  reviewBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewBannerContent: {
    flex: 1,
  },
  reviewBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  reviewBannerSubtitle: {
    fontSize: 12,
    color: '#B45309',
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
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  daysLeftText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
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
