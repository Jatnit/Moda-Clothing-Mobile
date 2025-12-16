import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import wishlistService from '../services/wishlistService';

const WishlistScreen = ({ navigation }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistService.getWishlist();
      if (response.success) {
        setWishlist(response.data?.items || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để xem danh sách yêu thích',
          [
            { text: 'Đóng', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlist();
  }, []);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Remove from wishlist
  const handleRemove = async (productId) => {
    Alert.alert(
      'Xóa khỏi yêu thích',
      'Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await wishlistService.removeFromWishlist(productId);
              if (response.success) {
                setWishlist(prev => prev.filter(item => item.ProductId !== productId));
              }
            } catch (error) {
              console.error('Error removing from wishlist:', error);
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
            }
          }
        }
      ]
    );
  };

  // Navigate to product detail
  const handleProductPress = (item) => {
    navigation?.navigate?.('ProductDetail', { 
      productId: item.ProductId 
    });
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  // Render wishlist item
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {item.ImageUrl ? (
          <Image source={{ uri: item.ImageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="shirt-outline" size={40} color={colors.gray300} />
          </View>
        )}
        
        {/* Remove button */}
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemove(item.ProductId)}
        >
          <Ionicons name="heart-dislike" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.ProductName}</Text>
        
        {/* Rating */}
        {parseFloat(item.AvgRating) > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={styles.ratingText}>{parseFloat(item.AvgRating || 0).toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({item.ReviewCount || 0})</Text>
          </View>
        )}
        
        <Text style={styles.productPrice}>{formatPrice(item.Price)}</Text>
        
        {/* Sold */}
        <Text style={styles.soldText}>Đã bán {item.SoldCount || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={60} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
      <Text style={styles.emptySubtitle}>
        Hãy thêm sản phẩm vào danh sách yêu thích để xem lại sau
      </Text>
      <TouchableOpacity 
        style={styles.shopNowButton}
        onPress={() => navigation?.navigate?.('Home')}
      >
        <Text style={styles.shopNowButtonText}>Khám phá sản phẩm</Text>
      </TouchableOpacity>
    </View>
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
        <Text style={styles.headerTitle}>Sản phẩm yêu thích</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>{wishlist.length}</Text>
        </View>
      </View>

      {/* Content */}
      {wishlist.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.ProductId?.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
  headerBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // List
  listContainer: {
    padding: 12,
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Product Card
  productCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.small,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: colors.textLight,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  soldText: {
    fontSize: 11,
    color: colors.textLight,
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
});

export default WishlistScreen;
