import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, shadows } from '../theme/colors';
import reviewService from '../services/reviewService';

const ReviewsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'my'
  const [myReviews, setMyReviews] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const [myRes, pendingRes] = await Promise.all([
        reviewService.getMyReviews(),
        reviewService.getPendingReviews(),
      ]);

      if (myRes.success) {
        setMyReviews(myRes.data || []);
      }
      if (pendingRes.success) {
        setPendingOrders(pendingRes.data?.orders || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (error.message?.includes('401')) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để xem đánh giá',
          [
            { text: 'Đóng', onPress: () => navigation.goBack() },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Open review modal
  const openReviewModal = (product, orderId) => {
    setSelectedProduct({ ...product, orderId });
    setRating(5);
    setComment('');
    setShowReviewModal(true);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const response = await reviewService.createReview({
        productId: selectedProduct.productId,
        orderId: selectedProduct.orderId,
        rating,
        comment: comment.trim(),
        images: [],
      });

      if (response.success) {
        Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
        setShowReviewModal(false);
        fetchData(); // Refresh data
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Render star rating
  const renderStars = (count, interactive = false, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && setRating(i)}
        >
          <Ionicons
            name={i <= count ? 'star' : 'star-outline'}
            size={size}
            color="#fbbf24"
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  // Render pending review item
  const renderPendingItem = (item, orderId) => (
    <View key={`${orderId}-${item.productId}`} style={styles.pendingItem}>
      <Image
        source={{ uri: item.thumbnailUrl || 'https://placehold.co/100x100/f5f5f5/666?text=No+Image' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
        <Text style={styles.productVariant}>
          {item.colorName && `Màu: ${item.colorName}`}
          {item.colorName && item.sizeName && ' | '}
          {item.sizeName && `Size: ${item.sizeName}`}
        </Text>
        <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>
      </View>
      <TouchableOpacity
        style={styles.reviewButton}
        onPress={() => openReviewModal(item, orderId)}
      >
        <Text style={styles.reviewButtonText}>Đánh giá</Text>
      </TouchableOpacity>
    </View>
  );

  // Render pending order
  const renderPendingOrder = (order) => (
    <View key={order.orderId} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderCode}>Đơn hàng #{order.orderCode}</Text>
        <View style={styles.daysLeftBadge}>
          <Ionicons name="time-outline" size={12} color={colors.warning || '#f59e0b'} />
          <Text style={styles.daysLeftText}>Còn {order.daysLeft} ngày</Text>
        </View>
      </View>
      <Text style={styles.orderDate}>Nhận hàng: {formatDate(order.completedAt)}</Text>
      
      {order.items.map(item => renderPendingItem(item, order.orderId))}
    </View>
  );

  // Render my review item
  const renderMyReview = (review) => (
    <View key={review.Id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.ThumbnailUrl || 'https://placehold.co/60x60/f5f5f5/666' }}
          style={styles.reviewProductImage}
        />
        <View style={styles.reviewProductInfo}>
          <Text style={styles.reviewProductName} numberOfLines={2}>{review.ProductName}</Text>
          {renderStars(review.Rating)}
          <Text style={styles.reviewDate}>{formatDate(review.CreatedAt)}</Text>
        </View>
      </View>
      {review.Comment && (
        <Text style={styles.reviewComment}>{review.Comment}</Text>
      )}
      {review.Images?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
          {review.Images.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Render empty state
  const renderEmpty = (type) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={type === 'pending' ? 'chatbubble-ellipses-outline' : 'star-outline'}
          size={50}
          color={colors.gray300}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {type === 'pending' ? 'Không có sản phẩm chờ đánh giá' : 'Chưa có đánh giá nào'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {type === 'pending'
          ? 'Sau khi nhận hàng, bạn có thể đánh giá sản phẩm trong 15 ngày'
          : 'Đánh giá sản phẩm sau khi mua hàng để nhận điểm thưởng'}
      </Text>
    </View>
  );

  // Review Modal
  const renderReviewModal = () => (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đánh giá sản phẩm</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {selectedProduct && (
            <>
              {/* Product info */}
              <View style={styles.modalProductInfo}>
                <Image
                  source={{ uri: selectedProduct.thumbnailUrl }}
                  style={styles.modalProductImage}
                />
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {selectedProduct.productName}
                </Text>
              </View>

              {/* Rating */}
              <Text style={styles.ratingLabel}>Đánh giá của bạn</Text>
              <View style={styles.ratingContainer}>
                {renderStars(rating, true, 36)}
              </View>
              <Text style={styles.ratingText}>
                {rating === 5 && 'Tuyệt vời'}
                {rating === 4 && 'Hài lòng'}
                {rating === 3 && 'Bình thường'}
                {rating === 2 && 'Không hài lòng'}
                {rating === 1 && 'Rất tệ'}
              </Text>

              {/* Comment */}
              <TextInput
                style={styles.commentInput}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
              />

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
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

  const pendingCount = pendingOrders.reduce((sum, order) => sum + order.items.length, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Chờ đánh giá
          </Text>
          {pendingCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            Đã đánh giá
          </Text>
          {myReviews.length > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeSecondary]}>
              <Text style={styles.tabBadgeText}>{myReviews.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'pending' ? (
          pendingOrders.length > 0 ? (
            pendingOrders.map(renderPendingOrder)
          ) : (
            renderEmpty('pending')
          )
        ) : (
          myReviews.length > 0 ? (
            myReviews.map(renderMyReview)
          ) : (
            renderEmpty('my')
          )
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Review Modal */}
      {renderReviewModal()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeSecondary: {
    backgroundColor: colors.gray400,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Order Card
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  orderDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  // Pending Item
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productVariant: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  quantity: {
    fontSize: 12,
    color: colors.textLight,
  },
  reviewButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },

  // Review Card
  reviewCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewProductImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  reviewProductInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewImages: {
    marginTop: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  modalProductName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 12,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 100,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default ReviewsScreen;
