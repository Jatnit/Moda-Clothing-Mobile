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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import { categoryService } from '../services/productService';

// Category icons mapping
const CATEGORY_ICONS = {
  'nam': 'man-outline',
  'nu': 'woman-outline',
  'ao-thun': 'shirt-outline',
  'ao-polo': 'shirt-outline',
  'so-mi': 'shirt-outline',
  'ao-khoac': 'layers-outline',
  'ao-tay-dai': 'shirt-outline',
  'quan': 'body-outline',
  'cotton': 'leaf-outline',
  'default': 'grid-outline',
};

// Category colors
const CATEGORY_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#FDF2F8', text: '#DB2777' },
  { bg: '#ECFDF5', text: '#059669' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#F0F9FF', text: '#0284C7' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#F5F3FF', text: '#7C3AED' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#DBEAFE', text: '#2563EB' },
];

const AllCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else if (Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Handle category press
  const handleCategoryPress = (category) => {
    navigation?.navigate?.('CategoryProducts', { category });
  };

  // Get icon for category
  const getIcon = (slug) => {
    return CATEGORY_ICONS[slug] || CATEGORY_ICONS.default;
  };

  // Render category item
  const renderCategory = ({ item, index }) => {
    const colorScheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    
    return (
      <TouchableOpacity
        style={[styles.categoryCard, { backgroundColor: colorScheme.bg }]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colorScheme.text + '20' }]}>
          {item.ImageUrl ? (
            <Image source={{ uri: item.ImageUrl }} style={styles.categoryImage} />
          ) : (
            <Ionicons name={getIcon(item.Slug)} size={28} color={colorScheme.text} />
          )}
        </View>

        {/* Info */}
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colorScheme.text }]}>{item.Name}</Text>
          <Text style={styles.productCount}>{item.ProductCount || 0} sản phẩm</Text>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color={colorScheme.text} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Đang tải danh mục...</Text>
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
        <Text style={styles.headerTitle}>Tất cả danh mục</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{categories.length} danh mục</Text>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.Id?.toString()}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={60} color={colors.gray300} />
            <Text style={styles.emptyText}>Không có danh mục nào</Text>
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
    textAlign: 'center',
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

  // Category Card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  productCount: {
    fontSize: 13,
    color: colors.textSecondary,
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

export default AllCategoriesScreen;
