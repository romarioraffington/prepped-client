// External Imports
import type React from "react";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Internal Imports
import type { Platform } from "@/libs/types";
import { BaseImageCard } from "./BaseImageCard";
import { getIonicPlatformIcon, formatCompactNumber } from "@/libs/utils";

// Import directly to avoid circular dependency with @/components
import { ShimmerImage } from "@/components/ShimmerImage";

interface PreviewCardProps {
  title?: string;
  platform: Platform;
  authorName: string;
  authorAvatarUri?: string;
  assetId: string;
  thumbnailUri: string;
  isLarge?: boolean;
  // Index for automatic masonry height variation
  index?: number;
  shouldRenderTitleOverlay?: boolean;
  viewCount?: number;
  onCardPress: (assetId: string) => void;
  onMenuPress?: (assetId: string) => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  assetId,
  isLarge,
  index,
  title,
  platform,
  thumbnailUri,
  authorName,
  authorAvatarUri,
  shouldRenderTitleOverlay = false,
  viewCount,
  onCardPress,
  onMenuPress,
}) => {
  const renderContent = () => (
    <View style={styles.contentContainer}>
      {title && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.metadataContainer}>
        <View style={styles.authorContainer}>
          {authorAvatarUri && (
            <View style={styles.avatarContainer}>
              <ShimmerImage
                source={{ uri: authorAvatarUri }}
                style={styles.authorAvatar}
              />
            </View>
          )}

          {authorName && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.authorName}
            >
              {authorName}
            </Text>
          )}
        </View>

        <View style={styles.rightMetaContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => onMenuPress?.(assetId)}>
            <Ionicons name="ellipsis-horizontal" size={15} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /**
   * Render the image overlay
   */
  const renderVideoStatsOverlay = () => (
    <View style={styles.statsOverlayContainer}>
      <View style={styles.statsRow}>
        <Ionicons name={'play-outline'} size={14} color="#fff" />
        <Text style={styles.statsText}>{formatCompactNumber(viewCount || 0)}</Text>
      </View>
      <View style={styles.statsPlatformIcon}>
        <Ionicons name={getIonicPlatformIcon(platform) as any} size={14} color="#fff" />
      </View>
    </View>
  );

  /**
   * Render the title text on the Image
   */
  const renderTitleOverlay = () => {
    if (!title) {
      return null;
    }

    // Handle different title formats:
    // - "Main Title: Subtitle"
    // - "Main Title in Location"
    // - "Number things to do in Location"
    let mainTitle = title;
    let subTitle = "";

    if (title.includes(":")) {
      [mainTitle, subTitle] = title.split(":").map((t) => t.trim());
    } else if (title.includes(" in ")) {
      const parts = title.split(" in ");
      mainTitle = parts[parts.length - 1];
      subTitle = parts[0];
    }

    return (
      <View style={styles.overlay}>
        <View style={styles.overlayTextContainer}>
          <Text style={styles.overlayMainText}>{mainTitle}</Text>
          {subTitle && <Text style={styles.overlaySubText}>{subTitle}</Text>}
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <BaseImageCard
          index={index}
          assetId={assetId}
          isLarge={isLarge}
          onPress={onCardPress}
          thumbnailUri={thumbnailUri}
          renderContent={renderContent}
          renderOverlay={
            shouldRenderTitleOverlay
              ? renderTitleOverlay
              : renderVideoStatsOverlay
          }
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // Base Image Card
  container: {
    overflow: 'hidden',
  },
  contentContainer: {
    marginTop: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 5,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  authorAvatar: {
    width: '100%',
    height: '100%',
  },
  authorName: {
    fontSize: 14,
    color: '#667',
    flex: 1,
  },
  rightMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
  },
  menuButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title Overlay
  overlay: {
    top: 0,
    bottom: 0,
    width: '100%',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  overlayTextContainer: {
    alignItems: 'center',
    width: '100%',
  },
  overlayMainText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    paddingHorizontal: 8,
  },
  overlaySubText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Image Overlay
  statsOverlayContainer: {
    bottom: 10,
    width: '100%',
    paddingHorizontal: 10,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRow: {
    padding: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statsPlatformIcon: {
    padding: 5,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
