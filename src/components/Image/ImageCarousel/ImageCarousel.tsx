// External dependencies
import { memo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

// Internal dependencies
import { useImageErrorFilter } from "@/hooks";
import { ImagePlaceholder, ShimmerImage } from "@/components/Image"; // Import ShimmerImage to avoid circular dependency

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const IMAGE_WIDTH = SCREEN_WIDTH / 2.5;

interface ImageCarouselProps {
  imageUrls: string[];
  imageWidth?: number;
  imageGap?: number;
  imageHeight?: number;
}

const ImageCarouselComponent = ({
  imageUrls,
  imageGap = 8,
  imageHeight = 140,
  imageWidth = IMAGE_WIDTH,
}: ImageCarouselProps) => {
  const { validImages, handleImageError } = useImageErrorFilter(imageUrls);

  return (
    <ScrollView
      horizontal
      snapToAlignment="center"
      decelerationRate="fast"
      scrollEventThrottle={16}
      directionalLockEnabled={true}
      style={{ height: imageHeight }}
      snapToInterval={imageWidth + imageGap}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: imageGap }}
    >
      {validImages.length > 0 ? (
        validImages.map((url, validIndex) => (
          <View
            key={`${url}-${validIndex}`}
            style={[
              styles.imageWrapper,
              {
                width: imageWidth,
                height: imageHeight,
              },
              validIndex === validImages.length - 1 && styles.lastImage,
            ]}
          >
            <ShimmerImage
              contentFit="cover"
              source={{ uri: url }}
              style={styles.carouselImage}
              onError={() => handleImageError(url)}
            />
          </View>
        ))
      ) : (
        <ImagePlaceholder
          iconSize={35}
          height={imageHeight}
          style={{
            width: imageWidth,
            borderRadius: 12,
          }}
        />
      )}
    </ScrollView>
  );
};

// Memoize ImageCarousel with custom comparison to prevent unnecessary re-renders
// Compare array contents by length and string values
export const ImageCarousel = memo(
  ImageCarouselComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.imageUrls.length === nextProps.imageUrls.length &&
      prevProps.imageUrls.every(
        (url, index) => url === nextProps.imageUrls[index],
      ) &&
      prevProps.imageWidth === nextProps.imageWidth &&
      prevProps.imageGap === nextProps.imageGap &&
      prevProps.imageHeight === nextProps.imageHeight
    );
  },
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  lastImage: {
    marginRight: 16,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
});
