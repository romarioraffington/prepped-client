// External Dependencies
import { Image } from "expo-image";
import React from "react";
import {
  Text,
  View,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Internal Dependencies
import { useImageErrorFilter } from "@/hooks";
import { ImagePlaceholder } from "@/components/Image";
import { reportWarning } from "@/libs/utils/errorReporting";

interface HeroProps {
  height?: number;
  imageUrls: string[];
  onImagePress?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  imageUrls,
  height = 400,
  onImagePress,
}) => {
  const { width } = Dimensions.get("window");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const { validImages, handleImageError } = useImageErrorFilter(
    imageUrls || [],
  );

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const pageNum = Math.round(contentOffset / width);
    setActiveIndex(pageNum);
  };

  if (validImages.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ImagePlaceholder height={height} iconSize={40} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {validImages.length > 1 ? (
        <ScrollView
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {validImages.map((url, index) => (
            <TouchableOpacity
              key={`${url}-${index}`}
              style={[{ width }]}
              onPress={onImagePress}
              activeOpacity={0.9}
            >
              <Image
                contentFit="cover"
                source={{ uri: url }}
                style={styles.image}
                onError={() => {
                  handleImageError(url);
                  const errorMessage = `Failed to load image: ${url}`;
                  reportWarning(errorMessage, {
                    component: "Hero",
                    action: "Image Loading",
                    extra: { imageUrl: url },
                  });
                }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity onPress={onImagePress} activeOpacity={0.9}>
          <Image
            contentFit="cover"
            style={styles.image}
            source={{ uri: validImages[0] }}
            onError={() => {
              handleImageError(validImages[0]);
              const errorMessage = `Failed to load image: ${validImages[0]}`;
              reportWarning(errorMessage, {
                component: "Hero",
                action: "Image Loading",
                extra: { imageUrl: validImages[0] },
              });
            }}
          />
        </TouchableOpacity>
      )}

      {/* Page counter in bottom right */}
      {validImages.length > 1 && (
        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>
            {activeIndex + 1} / {validImages.length}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  pageCounter: {
    bottom: 60,
    right: 16,
    zIndex: 1,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  pageCounterText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
