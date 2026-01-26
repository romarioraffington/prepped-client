// External Imports
import type React from "react";
import { StyleSheet, Text } from "react-native";

// Internal Imports
import { BaseImageCard } from "./BaseImageCard";

type ImageCardItem = {
  id: string;
  title: string;
  asset: {
    thumbnailUri: string;
  };
};
interface ImageCardProps {
  item: ImageCardItem;
  isLarge?: boolean;
  onPress: (item: ImageCardItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  isLarge,
  onPress,
}) => {
  const renderContent = () => (
    <Text style={styles.title} numberOfLines={2}>
      {item.title}
    </Text>
  );

  return (
    <BaseImageCard
      id={item.id}
      isLarge={isLarge}
      onPress={() => onPress(item)}
      renderContent={renderContent}
      thumbnailUri={item.asset.thumbnailUri}
    />
  );
};

const styles = StyleSheet.create({
  title: {
    color: "#334",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 18,
  },
});
