// External Dependencies
import type React from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Internal Dependencies
import { useImportContent } from '@/hooks';
import { truncate, reportError } from '@/libs/utils';
import { Colors, IMPORT_STATUS } from '@/libs/constants';
import type { ImportProgressItem as ImportProgressItemType, Platform } from '@/libs/types';

// Consts
const MAX_TITLE_LENGTH = 25;

interface ImportProgressItemProps {
  item: ImportProgressItemType;
  onClose: (id: string) => void;
  style?: any;
}

export const ImportProgressItem: React.FC<ImportProgressItemProps> = ({
  item,
  style,
  onClose,
}) => {
  const {
    id,
    url,
    error,
    title,
    status,
    platform,
    percentage,
    extractionId,
    thumbnailUri,
    hasRecommendations,
  } = item;

  const { importContent } = useImportContent();

  const isFailed = status === IMPORT_STATUS.FAILED;
  const isCompleted = status === IMPORT_STATUS.COMPLETED;

  /**
   * Smooth Progress Animation
   *
   * Provides a continuously animating progress bar at 60fps that interpolates
   * between backend polling checkpoints. This prevents the jarring "jump" effect
   * that occurs when progress updates only every 2 seconds from the backend.
   *
   * Key behaviors:
   * - Animates smoothly from current position toward backend's target checkpoint
   * - Uses ease-out effect (slows down as it approaches target) for natural feel
   * - Stops animation when extraction completes or fails
   * - Properly cleans up requestAnimationFrame to prevent memory leaks
   */
  const [displayProgress, setDisplayProgress] = useState(percentage);
  const animationRef = useRef<number | undefined>(undefined);

  /**
   * Main Animation Loop (60fps)
   *
   * Runs continuously while status is "processing". Animates displayProgress
   * toward the backend's target checkpoint using requestAnimationFrame.
   *
   * Backend provides checkpoints like: 10% → 15% → 30% → 50% → 75% → 100%
   * This loop smoothly fills the gaps between those checkpoints.
   *
   * Example flow:
   * - Poll #1: backend says "percentage: 10, targetPercentage: 15"
   * - Animation: 10 → 10.5 → 11 → 11.5 → ... → 15 (smooth)
   * - Poll #2: backend says "percentage: 15, targetPercentage: 30"
   * - Animation: 15 → 15.5 → 16 → ... → 30 (continues smoothly)
   */
  useEffect(() => {
    // Don't animate if completed or failed - set final value immediately
    if (isCompleted || isFailed) {
      setDisplayProgress(isCompleted ? 100 : percentage);
      return;
    }

    // Determine where we should be animating toward
    // Use backend's target checkpoint if available, otherwise use current percentage
    const targetProgress = item.targetPercentage ?? item.percentage;

    const animate = () => {
      setDisplayProgress((current) => {
        if (current < targetProgress) {
          // Calculate how far we still need to go
          const distance = targetProgress - current;

          // Ease-out effect: increment is proportional to remaining distance
          // - Far from target: larger increments (faster movement)
          // - Near target: smaller increments (slower movement, smooth landing)
          // Minimum 0.003 prevents stalling completely
          // Dividing by 100 reaches target in ~1-1.5 seconds (syncs with 2s backend polls)
          const increment = Math.max(0.003, distance / 100);

          return Math.min(current + increment, targetProgress);
        }
        return current;
      });

      // Schedule next frame - creates continuous 60fps animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup: cancel animation when component unmounts or dependencies change
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [item.targetPercentage, item.percentage, isCompleted, isFailed]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose(id);
  };

  const handleRetry = async () => {
    if (!url) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await importContent(url, {
        onSuccess: () => {
          console.log('Retry successful');
        },
        onError: (error) => {
          reportError(error, {
            component: "ImportProgressItem",
            action: "Retry Import",
            extra: { itemId: item.id, url: item.url },
          });
        },
      });
    } catch (error) {
      reportError(error, {
        component: "ImportProgressItem",
        action: "Retry Import",
        extra: { itemId: item.id, url: item.url },
      });
    }
  };

  const handleContentPress = () => {
    if (isCompleted && extractionId && hasRecommendations) {
      router.push({
        pathname: "/imports/[slug]",
        params: {
          slug: extractionId,
        },
      });
      onClose(id);
    }

    if (isFailed && url) {
      handleRetry();
    }
  };

  const getPlatformIcon = (platform: Platform): string => {
    switch (platform) {
      case 'tiktok':
        return 'logo-tiktok';
      case 'instagram':
        return 'logo-instagram';
      case 'youtube':
        return 'logo-youtube';
      default:
        return 'globe-outline';
    }
  };

  const getStatusText = (
    status: ImportProgressItemType['status'],
    progress?: number
  ): string => {
    switch (status) {
      case IMPORT_STATUS.PROCESSING:
        if (progress !== undefined) {
          if (progress > 80) {
            return 'Wrapping things up… 🎁'
          }
          if (progress === 80) {
            const messages = [
              'Analyzing your content...🫡',
              'Still working, bestie… 😗',
              'Hang tight… 🤗',
              'Making progress… 😗'
            ];
            return messages[Math.floor(Math.random() * messages.length)];
          }
        }
        return 'Processing...';
      case IMPORT_STATUS.FAILED:
        return 'Failed';
      case IMPORT_STATUS.COMPLETED:
        return hasRecommendations ? 'Completed' : 'No recommendations found';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = (status: ImportProgressItemType['status']): string => {
    switch (status) {
      case 'failed':
        return Colors.destructive;
      case 'completed':
        return '#34C759';
      default:
        return '#007AFF';
    }
  };

  return (
    <View style={[styles.container, style]}>

      {/* Thumbnail or Platform Icon */}
      <View style={styles.iconContainer}>
        {thumbnailUri ? (
          <Image
            contentFit="cover"
            style={styles.thumbnail}
            source={{ uri: thumbnailUri }}
          />
        ) : (
          <View style={styles.iconBackground}>
            <Ionicons size={22} color="white" name={getPlatformIcon(platform) as any} />
          </View>
        )}
      </View>

      {/* Content */}
      <TouchableOpacity style={styles.content} activeOpacity={0.5} onPress={handleContentPress}>
        <Text style={styles.title} numberOfLines={1}>{truncate(title, MAX_TITLE_LENGTH)}</Text>

        <View style={styles.statusRow}>

          <View style={styles.statusContainer}>
            {/* Completed Icon */}
            {isCompleted && hasRecommendations && (
              <Ionicons name="checkmark-circle" size={17} color="#34C759" />
            )}

            {isCompleted && !hasRecommendations && (
              <Ionicons name="information-circle" size={17} color="#007AFF" />
            )}

            {/* Failed Icon */}
            {isFailed && (
              <Ionicons name="alert-circle" size={17} color={Colors.destructive} />
            )}

            {/* Status Text */}
            <Text style={[styles.statusText, { color: isFailed ? Colors.destructive : '#007AFF' }]}>
              {error || getStatusText(status, displayProgress)}
            </Text>

            {/* Tap to view */}
            {isCompleted && hasRecommendations && (
              <Text style={styles.tapToViewText}>
                ⋅ Tap to view
              </Text>
            )}

            {isFailed && (
              <Text style={styles.tapToViewText}>
                ⋅ Tap to retry
              </Text>
            )}
          </View>

          {/* Percentage */}
          {!isCompleted && !isFailed && (
            <Text style={styles.percentage}>
              {`${Math.round(displayProgress)}%`}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        {!isCompleted && !isFailed && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${displayProgress}%`,
                  backgroundColor: getStatusColor(status)
                }
              ]}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Close Button */}
      {(isCompleted || isFailed) && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#667" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 18,
    marginVertical: 4,
    marginHorizontal: 40,
    shadowColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#330',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
    fontWeight: '600',
  },
  statusRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#E5E5E7',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    top: 10,
    right: 12,
    position: 'absolute',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapToViewText: {
    color: '#667',
    fontSize: 12,
    fontWeight: '400',
  },
  statusText: {
    fontSize: 12,
    color: '#667',
    fontWeight: '500',
  },
});
