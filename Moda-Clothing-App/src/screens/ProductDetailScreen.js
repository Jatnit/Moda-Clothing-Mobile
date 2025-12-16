import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import productService from '../services/productService';
import wishlistService from '../services/wishlistService';
import cartService from '../services/cartService';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { productId, product: initialProduct } = route?.params || {};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const galleryScrollRef = useRef(null);

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const id = productId || initialProduct?.Id;
      console.log('📦 Fetching product with ID:', id, 'productId:', productId, 'initialProduct?.Id:', initialProduct?.Id);
      
      if (!id) {
        console.log('❌ No product ID available');
        setLoading(false);
        return;
      }
      
      const response = await productService.getProductDetail(id);
      console.log('📥 Product response:', JSON.stringify(response, null, 2).slice(0, 500));
      
      if (response.success && response.data) {
        setProduct(response.data);
        initializeSelections(response.data);
      } else if (response && !response.success) {
        // API trả về nhưng không success
        console.log('❌ API returned error:', response.message);
        Alert.alert('Lỗi', response.message || 'Không thể tải thông tin sản phẩm');
      } else if (response && response.Id) {
        // Response là product data trực tiếp (không có wrapper)
        console.log('📦 Response is direct product data');
        setProduct(response);
        initializeSelections(response);
      }
      
      // Check wishlist status
      checkWishlistStatus(id);
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Check if product is in wishlist
  const checkWishlistStatus = async (prodId) => {
    try {
      const response = await wishlistService.checkInWishlist(prodId);
      if (response.success) {
        setIsFavorite(response.data?.isInWishlist || false);
      }
    } catch (error) {
      // Ignore error - user might not be logged in
      console.log('Wishlist check skipped (not logged in)');
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    const prodId = productId || initialProduct?.Id || product?.Id;
    if (!prodId) return;

    try {
      const response = await wishlistService.toggleWishlist(prodId);
      if (response.success) {
        setIsFavorite(response.data?.isInWishlist || false);
        Alert.alert('Thành công', response.message);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để thêm sản phẩm yêu thích',
          [
            { text: 'Đóng', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích');
      }
    }
  };

  const initializeSelections = (prod) => {
    // Set default color from available colors
    if (prod?.colors?.length > 0) {
      const firstColor = prod.colors[0];
      setSelectedColor({
        Id: firstColor.id,
        Value: firstColor.name,
        Code: firstColor.code,
      });
    }
    // Set default size from available sizes
    if (prod?.sizes?.length > 0) {
      const firstSize = prod.sizes[0];
      setSelectedSize({
        Id: firstSize.id,
        Value: firstSize.name,
      });
    }
  };

  // Get images based on selected color
  const currentImages = useMemo(() => {
    if (!product) return [];
    
    // If color selected, try to find color-specific image
    if (selectedColor && product.colorImages?.length > 0) {
      const colorImage = product.colorImages.find(
        img => img.ColorValueId === selectedColor.Id
      );
      if (colorImage) {
        return [colorImage.ImageUrl];
      }
    }
    
    // Otherwise use galleries
    if (product.galleries?.length > 0) {
      return product.galleries.map(g => g.ImageUrl);
    }
    
    // Fallback to main image
    return [product.ImageUrl || 'https://via.placeholder.com/400'];
  }, [product, selectedColor]);

  // Get current SKU based on selected color and size
  const currentSku = useMemo(() => {
    if (!product?.skus || !selectedColor || !selectedSize) return null;
    
    return product.skus.find(
      sku => sku.ColorValueId === selectedColor.Id && sku.SizeValueId === selectedSize.Id
    );
  }, [product, selectedColor, selectedSize]);

  // Get current price from SKU or product
  const currentPrice = useMemo(() => {
    if (currentSku) {
      return parseFloat(currentSku.Price);
    }
    return parseFloat(product?.Price) || 0;
  }, [currentSku, product]);

  // Get stock quantity
  const stockQuantity = useMemo(() => {
    return currentSku?.StockQuantity || 0;
  }, [currentSku]);

  // Check if variant is available
  const isSizeAvailable = (size) => {
    if (!product?.skus || !selectedColor) return true;
    
    const sku = product.skus.find(
      s => s.ColorValueId === selectedColor.Id && s.SizeValueId === size.Id
    );
    return sku && sku.StockQuantity > 0;
  };

  // Handle go back
  const handleGoBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  // Update quantity - check against stock
  const updateQuantity = (delta) => {
    const maxQty = Math.min(stockQuantity, 99);
    setQuantity(prev => Math.max(1, Math.min(maxQty, prev + delta)));
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor({
      Id: color.id,
      Value: color.name,
      Code: color.code,
    });
    setActiveImageIndex(0);
    // Scroll to first image when color changes
    galleryScrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize({
      Id: size.id,
      Value: size.name,
    });
    setQuantity(1); // Reset quantity when size changes
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!selectedColor || !selectedSize) {
      Alert.alert('Thông báo', 'Vui lòng chọn màu sắc và kích thước');
      return;
    }

    if (stockQuantity === 0) {
      Alert.alert('Thông báo', 'Sản phẩm này đã hết hàng');
      return;
    }

    if (!currentSku?.Id) {
      Alert.alert('Thông báo', 'Không tìm thấy thông tin sản phẩm');
      return;
    }

    try {
      const response = await cartService.addToCart(currentSku.Id, quantity);
      if (response.success) {
        Alert.alert(
          '🛒 Đã thêm vào giỏ hàng',
          `${product.Name}\n${selectedColor.Value} - ${selectedSize.Value} x ${quantity}`,
          [
            { text: 'Tiếp tục mua', style: 'cancel' },
            { text: 'Xem giỏ hàng', onPress: () => navigation?.navigate?.('Cart') }
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể thêm vào giỏ hàng');
      }
    } catch (error) {
      if (error.message?.includes('401') || error.message?.includes('token')) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
          [
            { text: 'Đóng', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => navigation?.navigate?.('Login') }
          ]
        );
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể thêm vào giỏ hàng');
      }
    }
  };

  // Buy now
  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) {
      Alert.alert('Thông báo', 'Vui lòng chọn màu sắc và kích thước');
      return;
    }

    if (stockQuantity === 0) {
      Alert.alert('Thông báo', 'Sản phẩm này đã hết hàng');
      return;
    }

    const orderItem = {
      productId: product.Id,
      skuId: currentSku?.Id,
      name: product.Name,
      price: currentPrice,
      color: selectedColor,
      size: selectedSize,
      quantity,
      image: currentImages[0],
    };

    navigation?.navigate?.('Checkout', {
      items: [orderItem],
      total: currentPrice * quantity,
    });
  };

  // Render image gallery
  const renderImageGallery = () => {
    return (
      <View style={styles.galleryContainer}>
        <ScrollView
          ref={galleryScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveImageIndex(index);
          }}
        >
          {currentImages.map((imageUrl, index) => (
            <Image
              key={`${selectedColor?.Id}-${index}`}
              source={{ uri: imageUrl }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Back button */}
        <TouchableOpacity style={styles.backButtonFloat} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Favorite button */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={toggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? colors.error : colors.textPrimary} 
          />
        </TouchableOpacity>

        {/* Image indicators */}
        {currentImages.length > 1 && (
          <View style={styles.imageIndicators}>
            {currentImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  index === activeImageIndex && styles.imageIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render color options
  const renderColorOptions = () => {
    const colorOptions = product?.colors || [];
    
    if (colorOptions.length === 0) return null;

    return (
      <View style={styles.optionSection}>
        <Text style={styles.optionTitle}>
          Màu sắc: <Text style={styles.optionValue}>{selectedColor?.Value}</Text>
        </Text>
        <View style={styles.colorOptions}>
          {colorOptions.map((color) => {
            const isSelected = selectedColor?.Id === color.id;
            return (
              <TouchableOpacity
                key={color.id}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.code || '#ccc' },
                  isSelected && styles.colorOptionSelected,
                ]}
                onPress={() => handleColorSelect(color)}
              >
                {isSelected && (
                  <Ionicons 
                    name="checkmark" 
                    size={18} 
                    color={color.code === '#FFFFFF' ? colors.black : colors.white} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render size options
  const renderSizeOptions = () => {
    const sizeOptions = product?.sizes || [];
    
    if (sizeOptions.length === 0) return null;

    return (
      <View style={styles.optionSection}>
        <View style={styles.sizeHeader}>
          <Text style={styles.optionTitle}>
            Kích thước: <Text style={styles.optionValue}>{selectedSize?.Value}</Text>
          </Text>
          {currentSku && (
            <Text style={[
              styles.stockText,
              stockQuantity === 0 && styles.stockTextOut
            ]}>
              {stockQuantity > 0 ? `Còn ${stockQuantity} sản phẩm` : 'Hết hàng'}
            </Text>
          )}
        </View>
        <View style={styles.sizeOptions}>
          {sizeOptions.map((size) => {
            const isSelected = selectedSize?.Id === size.id;
            const isAvailable = isSizeAvailable({ Id: size.id });
            
            return (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.sizeOption,
                  isSelected && styles.sizeOptionSelected,
                  !isAvailable && styles.sizeOptionUnavailable,
                ]}
                onPress={() => handleSizeSelect(size)}
                disabled={!isAvailable}
              >
                <Text style={[
                  styles.sizeOptionText,
                  isSelected && styles.sizeOptionTextSelected,
                  !isAvailable && styles.sizeOptionTextUnavailable,
                ]}>
                  {size.name}
                </Text>
                {!isAvailable && <View style={styles.sizeStrikethrough} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.textLight} />
          <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Category */}
          {product.CategoryName && (
            <Text style={styles.categoryText}>{product.CategoryName}</Text>
          )}

          {/* Name */}
          <Text style={styles.productName}>{product.Name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>
                {parseFloat(product.AvgRating || 0).toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({product.ReviewCount || 0} đánh giá)
              </Text>
            </View>
            <Text style={styles.soldText}>
              Đã bán {product.SoldCount || 0}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{formatPrice(currentPrice)}</Text>
            {product.OriginalPrice && product.OriginalPrice > currentPrice && (
              <>
                <Text style={styles.originalPrice}>
                  {formatPrice(product.OriginalPrice)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round((1 - currentPrice / product.OriginalPrice) * 100)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Color Options */}
          {renderColorOptions()}

          {/* Size Options */}
          {renderSizeOptions()}

          {/* Quantity */}
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Số lượng</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(-1)}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? colors.textLight : colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(1)}
                disabled={quantity >= stockQuantity}
              >
                <Ionicons name="add" size={20} color={quantity >= stockQuantity ? colors.textLight : colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.descriptionText}>
              {product.Description || 'Chưa có mô tả cho sản phẩm này.'}
            </Text>
          </View>

          {/* Shipping Info */}
          <View style={styles.shippingInfo}>
            <View style={styles.shippingItem}>
              <Ionicons name="car-outline" size={20} color={colors.success} />
              <Text style={styles.shippingText}>Miễn phí vận chuyển</Text>
            </View>
            <View style={styles.shippingItem}>
              <Ionicons name="refresh-outline" size={20} color={colors.success} />
              <Text style={styles.shippingText}>Đổi trả trong 7 ngày</Text>
            </View>
            <View style={styles.shippingItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
              <Text style={styles.shippingText}>Bảo hành chính hãng</Text>
            </View>
          </View>

          {/* Reviews Section */}
          {product.reviews && product.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <View style={styles.reviewsTitleRow}>
                  <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
                  <View style={styles.reviewsBadge}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.reviewsAvg}>{parseFloat(product.AvgRating || 0).toFixed(1)}</Text>
                    <Text style={styles.reviewsCount}>({product.ReviewCount || 0})</Text>
                  </View>
                </View>
              </View>

              {/* Reviews List */}
              {product.reviews.slice(0, 3).map((review, index) => (
                <View key={review.Id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      {review.AvatarUrl ? (
                        <Image source={{ uri: review.AvatarUrl }} style={styles.reviewerAvatar} />
                      ) : (
                        <View style={styles.reviewerAvatarPlaceholder}>
                          <Text style={styles.reviewerAvatarText}>
                            {(review.FullName || review.Username || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewerDetails}>
                        <Text style={styles.reviewerName}>{review.FullName || review.Username}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.CreatedAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= review.Rating ? 'star' : 'star-outline'}
                          size={14}
                          color="#fbbf24"
                        />
                      ))}
                    </View>
                  </View>
                  {review.Comment && (
                    <Text style={styles.reviewComment}>{review.Comment}</Text>
                  )}
                </View>
              ))}

              {/* See All Reviews */}
              {product.ReviewCount > 3 && (
                <TouchableOpacity style={styles.seeAllReviewsButton}>
                  <Text style={styles.seeAllReviewsText}>
                    Xem tất cả {product.ReviewCount} đánh giá
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* No Reviews Yet */}
          {(!product.reviews || product.reviews.length === 0) && (
            <View style={styles.noReviewsSection}>
              <View style={styles.noReviewsIcon}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.gray300} />
              </View>
              <Text style={styles.noReviewsText}>Chưa có đánh giá nào</Text>
              <Text style={styles.noReviewsSubtext}>Hãy là người đầu tiên đánh giá sản phẩm này!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.addToCartButton, stockQuantity === 0 && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={stockQuantity === 0}
        >
          <Ionicons name="cart-outline" size={22} color={stockQuantity === 0 ? colors.textLight : colors.primary} />
          <Text style={[styles.addToCartText, stockQuantity === 0 && styles.buttonTextDisabled]}>
            {stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.buyNowButton, stockQuantity === 0 && styles.buyNowButtonDisabled]}
          onPress={handleBuyNow}
          disabled={stockQuantity === 0}
        >
          <Text style={styles.buyNowText}>Mua ngay</Text>
          <Text style={styles.buyNowPrice}>{formatPrice(currentPrice * quantity)}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gallery
  galleryContainer: {
    position: 'relative',
    width: width,
    height: width,
  },
  galleryImage: {
    width: width,
    height: width,
    backgroundColor: colors.gray100,
  },
  backButtonFloat: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: colors.white,
    width: 24,
  },

  // Product Info
  productInfo: {
    padding: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 30,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  soldText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },

  // Options
  optionSection: {
    marginBottom: 16,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  optionValue: {
    color: colors.accent,
  },
  stockText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  stockTextOut: {
    color: colors.error,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.small,
  },
  colorOptionSelected: {
    borderColor: colors.primary,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeOption: {
    minWidth: 50,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  sizeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeOptionUnavailable: {
    backgroundColor: colors.gray100,
    opacity: 0.5,
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sizeOptionTextSelected: {
    color: colors.white,
  },
  sizeOptionTextUnavailable: {
    color: colors.textLight,
  },
  sizeStrikethrough: {
    position: 'absolute',
    width: '120%',
    height: 2,
    backgroundColor: colors.error,
    transform: [{ rotate: '-15deg' }],
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },

  // Description
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Shipping
  shippingInfo: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  shippingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shippingText: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 8,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonDisabled: {
    borderColor: colors.gray300,
  },
  buttonTextDisabled: {
    color: colors.textLight,
  },
  buyNowButton: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    ...shadows.medium,
  },
  buyNowButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  buyNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  buyNowPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Reviews Section
  reviewsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  reviewsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewsAvg: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewsCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: colors.gray50,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  seeAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    gap: 6,
  },
  seeAllReviewsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },

  // No Reviews
  noReviewsSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noReviewsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noReviewsText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default ProductDetailScreen;
