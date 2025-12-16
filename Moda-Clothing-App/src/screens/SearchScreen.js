import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';
import wishlistService from '../services/wishlistService';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Popular search suggestions
const POPULAR_SEARCHES = [
  'Áo thun',
  'Quần jean',
  'Váy đầm',
  'Áo khoác',
  'Áo sơ mi',
  'Quần short',
];

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery.trim(), 300);

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

  // Search products with debounce
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchProducts(debouncedQuery);
    } else {
      setProducts([]);
      setSearched(false);
    }
  }, [debouncedQuery]);

  // Focus input on mount
  useEffect(() => {
    fetchWishlist();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Search function
  const searchProducts = async (query) => {
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await productService.searchProducts(query, { limit: 50 });
      if (response.success) {
        setProducts(response.data?.products || response.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion press
  const handleSuggestionPress = (term) => {
    setSearchQuery(term);
  };

  // Handle go back
  const handleGoBack = () => {
    Keyboard.dismiss();
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Handle product press
  const handleProductPress = (product) => {
    Keyboard.dismiss();
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

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setProducts([]);
    setSearched(false);
    inputRef.current?.focus();
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

  // Render suggestions
  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      {/* Popular Searches */}
      <Text style={styles.sectionTitle}>Tìm kiếm phổ biến</Text>
      <View style={styles.tagsContainer}>
        {POPULAR_SEARCHES.map((term, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tag}
            onPress={() => handleSuggestionPress(term)}
          >
            <Ionicons name="trending-up" size={14} color={colors.accent} />
            <Text style={styles.tagText}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Tìm kiếm gần đây
          </Text>
          {recentSearches.map((term, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentItem}
              onPress={() => handleSuggestionPress(term)}
            >
              <Ionicons name="time-outline" size={18} color={colors.textLight} />
              <Text style={styles.recentText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  // Render empty results
  const renderEmptyResults = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={60} color={colors.gray300} />
      <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
      <Text style={styles.emptySubtitle}>
        Thử tìm với từ khóa khác hoặc kiểm tra chính tả
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textLight} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      )}

      {/* Results or Suggestions */}
      {!searched && !loading ? (
        renderSuggestions()
      ) : searched && products.length === 0 && !loading ? (
        renderEmptyResults()
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.Id?.toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            searched && products.length > 0 ? (
              <Text style={styles.resultsCount}>
                {products.length} kết quả cho "{searchQuery}"
              </Text>
            ) : null
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },

  // Loading
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.accent + '10',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.accent,
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
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // Suggestions
  suggestionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  recentText: {
    fontSize: 14,
    color: colors.textPrimary,
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

export default SearchScreen;
