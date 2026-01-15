import type React from "react";
import { Image, type ImageSource } from "expo-image";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

type ProfileIconProps = {
  size?: number;
  letter?: string;
  imageUrl?: string | ImageSource;
  onPress?: () => void;
};

export const ProfileIcon: React.FC<ProfileIconProps> = ({
  size = 35,
  letter = '',
  imageUrl = '',
  onPress,
}) => {
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
    >
      {imageUrl ? (
        <Image
          cachePolicy="memory-disk"
          style={[styles.image, { width: size, height: size }]}
          source={typeof imageUrl === "string" ? { uri: imageUrl } : imageUrl}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Text style={[styles.letter, { fontSize: size * 0.5 }]}>
            {letter}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 100,
  },
  image: {
    borderRadius: 100,
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize: 14,
    fontWeight: "500",
    color: "black",
  },
});
