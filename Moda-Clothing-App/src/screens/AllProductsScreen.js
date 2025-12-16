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
import { useFocusEffect } from '@react-navigation/native';
import { colors, shadows } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';
import wishlistService from '../services/wishlistService';

const AllProductsScreen = ({ navigation, route }) => {
  const { type, title } = route?.params || {};
  // type: 'featured' | 'new' | 'category'
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Fetch products based on type
  const fetchProducts = async () => {
    try {
      let response;
      
      switch (type) {
        case 'featured':
          response = await productService.getFeaturedProducts(10);
          break;
        case 'new':
          response = await productService.getNewProducts(10);
          break;
        default:
          response = await productService.getProducts({ limit: 20 });
      }

      if (response.success) {
        setProducts(response.data || []);
      } else if (Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch wishlist IDs
  const fetchWishlistIds = async () => {
    try {
      const response = await wishlistService.getWishlist();
      if (response.success && response.data?.items) {
        const ids = new Set(response.data.items.map(item => item.ProductId));
        setWishlistIds(ids);
      }
    } catch (error) {
      console.log('Wishlist fetch skipped:', error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchWishlistIds();
  }, [type]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchWishlistIds();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
    fetchWishlistIds();
  }, [type]);

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

  // Handle favorite toggle
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
      console.log('Wishlist toggle error:', error.message);
    }
  };

  // Render product
  const renderProduct = ({ item, index }) => (
    <ProductCard
      product={item}
      onPress={handleProductPress}
      onFavorite={handleFavorite}
      isFavorite={wishlistIds.has(item.Id)}
      style={index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }}
    />
  );

  // Get screen title
  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'featured':
        return 'Bán chạy nhất';
      case 'new':
        return 'Hàng mới về';
      default:
        return 'Tất cả sản phẩm';
    }
  };

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
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation?.navigate?.('Search')}
        >
          <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Product Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{products.length} sản phẩm</Text>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.Id?.toString()}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color={colors.gray300} />
            <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
          </View>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Count
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  countText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // List
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AllProductsScreen;
