import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import SectionHeader from '../components/SectionHeader';
import { productService, categoryService } from '../services/productService';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

// Mock banners data
const BANNERS = [
  {
    id: 1,
    title: 'Bộ Sưu Tập Mùa Đông',
    subtitle: 'Giảm đến 50%',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=400&fit=crop',
    color: '#667eea',
  },
  {
    id: 2,
    title: 'Thời Trang Nam',
    subtitle: 'Phong cách lịch lãm',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=400&fit=crop',
    color: '#f093fb',
  },
  {
    id: 3,
    title: 'Flash Sale',
    subtitle: 'Chỉ hôm nay - Giảm 30%',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=400&fit=crop',
    color: '#e94560',
  },
];

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, featuredRes, newRes] = await Promise.all([
        categoryService.getCategories(),
        productService.getFeaturedProducts(8),
        productService.getNewProducts(8),
      ]);

      setCategories(categoriesRes.data || []);
      setFeaturedProducts(featuredRes.data || []);
      setNewProducts(newRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto scroll banner
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeBanner + 1) % BANNERS.length;
      setActiveBanner(nextIndex);
      bannerRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeBanner]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Navigate to product detail
  const handleProductPress = (product) => {
    // navigation.navigate('ProductDetail', { productId: product.Id });
    console.log('Product pressed:', product.Name);
  };

  // Navigate to category
  const handleCategoryPress = (category) => {
    // navigation.navigate('Category', { categorySlug: category.Slug });
    console.log('Category pressed:', category.Name);
  };

  // Render banner
  const renderBanner = () => (
    <View style={styles.bannerContainer}>
      <ScrollView
        ref={bannerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveBanner(index);
        }}
      >
        {BANNERS.map((banner, index) => (
          <TouchableOpacity 
            key={banner.id} 
            style={styles.bannerItem}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: banner.image }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={[styles.bannerOverlay, { backgroundColor: banner.color + '99' }]}>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <TouchableOpacity style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Khám phá ngay</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {BANNERS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeBanner && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MODA</Text>
          <Text style={styles.logoSubtext}>CLOTHING</Text>
        </View>

        {/* Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textLight} />
        <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm...</Text>
        <View style={styles.searchFilter}>
          <Ionicons name="options-outline" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render categories
  const renderCategories = () => (
    <View>
      <SectionHeader 
        title="Danh mục" 
        subtitle="Khám phá theo phong cách"
        onSeeAll={() => console.log('See all categories')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.slice(0, 8).map((category, index) => (
          <CategoryCard
            key={category.Id}
            category={category}
            index={index}
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>
    </View>
  );

  // Render product grid
  const renderProductGrid = (products, title, subtitle) => (
    <View>
      <SectionHeader 
        title={title}
        subtitle={subtitle}
        onSeeAll={() => console.log('See all', title)}
      />
      <View style={styles.productGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.Id}
            product={product}
            onPress={handleProductPress}
          />
        ))}
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {renderHeader()}
        {renderBanner()}
        {renderCategories()}
        
        {/* Featured Products */}
        {featuredProducts.length > 0 && 
          renderProductGrid(
            featuredProducts.slice(0, 4), 
            'Bán chạy nhất', 
            'Được yêu thích nhất tuần này'
          )
        }

        {/* Promo Banner */}
        <TouchableOpacity style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <Text style={styles.promoLabel}>ƯU ĐÃI ĐẶC BIỆT</Text>
            <Text style={styles.promoTitle}>Mua 2 Giảm 20%</Text>
            <Text style={styles.promoSubtitle}>Áp dụng cho tất cả áo thun</Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Mua ngay</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop' }}
              style={styles.promoImage}
            />
          </View>
        </TouchableOpacity>

        {/* New Products */}
        {newProducts.length > 0 && 
          renderProductGrid(
            newProducts.slice(0, 4), 
            'Hàng mới về', 
            'Cập nhật xu hướng mới nhất'
          )
        }

        {/* Footer space */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    backgroundColor: colors.accent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: colors.textLight,
  },
  searchFilter: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },

  // Banner
  bannerContainer: {
    height: BANNER_HEIGHT,
    marginBottom: 8,
  },
  bannerItem: {
    width: width,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 4,
    fontWeight: '500',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 16,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.white,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
  },

  // Product Grid
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  // Promo Banner
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  promoLabel: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  promoImageContainer: {
    width: 120,
    height: 120,
    marginLeft: 10,
  },
  promoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});

export default HomeScreen;
