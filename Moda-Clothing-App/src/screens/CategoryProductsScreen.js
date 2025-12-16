import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';
import wishlistService from '../services/wishlistService';

const CategoryProductsScreen = ({ navigation, route }) => {
  const { category } = route?.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Fetch products
  const fetchProducts = async (pageNum = 1, refresh = false) => {
    if (!category?.Id && !category?.Slug) return;

    try {
      const response = await productService.getProductsByCategory(
        category.Slug || category.Id,
        { page: pageNum, limit: 10 }
      );

      if (response.success) {
        const newProducts = response.data?.products || response.data || [];
        if (refresh || pageNum === 1) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        setHasMore(newProducts.length >= 10);
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Fetch wishlist
  const fetchWishlist = async () => {
    try {
      const response = await wishlistService.getWishlist();
      if (response.success && response.data?.items) {
        const ids = new Set(response.data.items.map(item => item.ProductId));
        setWishlistIds(ids);
      }
    } catch (error) {
      console.log('Wishlist fetch skipped');
    }
  };

  useEffect(() => {
    fetchProducts(1, true);
    fetchWishlist();
  }, [category]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, true);
  }, [category]);

  // Load more
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Handle product press
  const handleProductPress = (product) => {
    navigation?.navigate?.('ProductDetail', { productId: product.Id, product });
  };

  // Handle favorite
  const handleFavorite = async (product) => {
    try {
      const response = await wishlistService.toggleWishlist(product.Id);
      if (response.success) {
        setWishlistIds(prev => {
          const newSet = new Set(prev);
          if (response.data?.isInWishlist) {
            newSet.add(product.Id);
          } else {
            newSet.delete(product.Id);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.log('Toggle wishlist error:', error);
    }
  };

  // Render product item
  const renderProduct = ({ item, index }) => (
    <View style={styles.productWrapper}>
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onFavorite={handleFavorite}
        isFavorite={wishlistIds.has(item.Id)}
      />
    </View>
  );

  // Render footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  // Render empty
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="shirt-outline" size={60} color={colors.gray300} />
      <Text style={styles.emptyTitle}>Chưa có sản phẩm</Text>
      <Text style={styles.emptySubtitle}>
        Danh mục này hiện chưa có sản phẩm nào
      </Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {category?.Name || 'Danh mục'}
          </Text>
          <Text style={styles.productCount}>
            {products.length} sản phẩm
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => navigation?.navigate?.('Search')}
        >
          <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.Id?.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
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
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContainer: {
    padding: 12,
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: '48%',
    marginBottom: 4,
  },

  // Footer
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CategoryProductsScreen;
