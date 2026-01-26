// External Dependencies
import type React from "react";
import { StyleSheet, View } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { BaseImageCard } from "./BaseImageCard";

interface PreviewCardProps {
  id: string;
  index?: number;
  isLarge?: boolean;
  thumbnailUri?: string | null;
  onCardPress: (id: string) => void;
  renderContent?: () => React.ReactNode;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  id,
  index,
  isLarge,
  thumbnailUri,
  onCardPress,
  renderContent,
}) => {
  return (
    <View style={styles.container}>
      <BaseImageCard
        id={id}
        index={index}
        isLarge={isLarge}
        onPress={onCardPress}
        renderContent={renderContent}
        thumbnailUri={thumbnailUri ?? ""}
        backgroundColor={Colors.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
