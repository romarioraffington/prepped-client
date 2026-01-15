// External dependencies
import { memo, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';

// Internal dependencies
import type { Hours } from '@/libs/types'
import { hasValidHours } from '@/libs/utils';

// Imported directly to prevent circular dependencies warning
import { ImageCarousel } from '@/components/ImageCarousel';
import { EntityInfo } from '@/components/Entity/EntityInfo';
import { RatingInfo } from '@/components/Rating/RatingInfo';
import { HoursStatus } from '@/components/Hours/HoursStatus';

interface EntityCardProps {
  title: string;
  rating?: number;
  category: string;
  hours?: Hours;
  reviewCount?: number;
  imageUrls?: string[];
  priceRange?: string;
  isAccessible?: boolean;
  editorialSummary?: string;
  titleActions?: ReactNode;
  contentContainerStyle?: ViewStyle;
  onPress?: (event: GestureResponderEvent) => void;
}

const EntityCardComponent = ({
  title,
  rating,
  hours,
  category,
  reviewCount,
  isAccessible,
  priceRange,
  titleActions,
  imageUrls = [],
  editorialSummary,
  contentContainerStyle,
  onPress,
}: EntityCardProps) => {
  const isRatingAvailable = rating !== undefined && reviewCount !== undefined;
  const isEditorialSummaryAvailable = editorialSummary && editorialSummary.length > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      delayPressIn={100}
      style={styles.container}
    >

      <View style={[styles.contentContainer, contentContainerStyle]}>
        <ImageCarousel imageUrls={imageUrls} />
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          {titleActions && (
            <View>
              {titleActions}
            </View>
          )}
        </View>

        {
          isRatingAvailable && (
            <RatingInfo rating={rating} reviewCount={reviewCount} />
          )
        }

        <EntityInfo
          category={category}
          isAccessible={isAccessible}
          priceRange={priceRange}
        />

        {hours && hasValidHours(hours) && (
          <HoursStatus hours={hours} />
        )}

        {
          isEditorialSummaryAvailable && (
            <Text style={styles.editorialSummary}>{editorialSummary}</Text>
          )
        }
      </View>
    </TouchableOpacity>
  );
};

// Memoize EntityCard to prevent unnecessary re-renders when parent re-renders
export const EntityCard = memo(EntityCardComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editorialSummary: {
    flex: 1,
    fontSize: 14,
    marginTop: 3,
    color: '#888',
    lineHeight: 18,
    fontWeight: '400',
  },
  titleRow: {
    gap: 8,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    fontWeight: "600",
  },
});
