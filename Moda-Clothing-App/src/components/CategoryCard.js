import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';

// Icon mapping cho các danh mục
const categoryIcons = {
  'nam': 'man-outline',
  'nu': 'woman-outline',
  'ao-thun': 'shirt-outline',
  'ao-polo': 'shirt-outline',
  'so-mi': 'shirt-outline',
  'ao-khoac': 'cloudy-outline',
  'quan': 'resize-outline',
  'ao-tay-dai': 'shirt-outline',
  'cotton': 'leaf-outline',
  'default': 'grid-outline',
};

// Gradient colors cho các danh mục
const categoryColors = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f'],
];

const CategoryCard = ({ category, index, onPress }) => {
  const iconName = categoryIcons[category.Slug] || categoryIcons.default;
  const gradientColors = categoryColors[index % categoryColors.length];

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(category)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: gradientColors[0] }]}>
        <Ionicons name={iconName} size={24} color={colors.white} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {category.Name}
      </Text>
      <Text style={styles.count}>{category.ProductCount || 0} SP</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 75,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.small,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  count: {
    fontSize: 10,
    color: colors.textLight,
  },
});

export default CategoryCard;
