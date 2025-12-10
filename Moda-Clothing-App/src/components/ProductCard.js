import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const ProductCard = ({ product, onPress, onFavorite, style }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={() => onPress?.(product)}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.ThumbnailUrl || 'https://placehold.co/300x400/f5f5f5/666?text=No+Image' }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => onFavorite?.(product)}
        >
          <Ionicons name="heart-outline" size={20} color={colors.gray600} />
        </TouchableOpacity>

        {/* Badge - New or Sale */}
        {product.isNew && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Mới</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category */}
        {product.categories?.[0] && (
          <Text style={styles.category} numberOfLines={1}>
            {product.categories[0].Name}
          </Text>
        )}

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {product.Name}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.BasePrice)}</Text>
          {product.OriginalPrice && product.OriginalPrice > product.BasePrice && (
            <Text style={styles.originalPrice}>
              {formatPrice(product.OriginalPrice)}
            </Text>
          )}
        </View>

        {/* Rating */}
        {product.AvgRating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.rating}>{parseFloat(product.AvgRating).toFixed(1)}</Text>
            {product.ReviewCount > 0 && (
              <Text style={styles.reviewCount}>({product.ReviewCount})</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadows.small,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    backgroundColor: colors.gray100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: colors.textLight,
  },
});

export default ProductCard;
