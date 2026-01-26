import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import type React from "react";
import {
  Image,
  type ImageSourcePropType,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface EmptyImageStateProps {
  title?: string;
  description?: string;
  showPlayIcons?: boolean;
  imageHeight?: number;
  imageUri?: ImageSourcePropType;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const EmptyImageState: React.FC<EmptyImageStateProps> = ({
  title,
  imageUri,
  description,
  imageHeight = 250,
  showPlayIcons = false,
  refreshControl,
}) => {
  const content = (
    <View style={styles.container}>
      {/* Art Grid Background or Single Image */}
      {imageUri ? (
        <View style={styles.singleImageContainer}>
          <Image source={imageUri} style={styles.singleImage} />
        </View>
      ) : (
        <View style={[styles.artGrid, { height: imageHeight }]}>
          {/* Left column*/}
          <View style={styles.artLeftColumn}>
            <View>
              <Image
                style={styles.artLeftTopImage}
                source={require("assets/images/empty-view/trevi-fountain.webp")}
              />
              {showPlayIcons && (
                <View style={[styles.overlay, styles.overlayLeftTop]}>
                  <Ionicons
                    style={{ opacity: 0.8 }}
                    name="play-circle"
                    size={28}
                    color="white"
                  />
                </View>
              )}
            </View>
            <View>
              <Image
                style={styles.artLeftBottomImage}
                source={require("assets/images/empty-view/space-needle.webp")}
              />
              {showPlayIcons && (
                <View style={[styles.overlay, styles.overlayLeftBottom]}>
                  <Ionicons
                    style={{ opacity: 0.8 }}
                    name="play-circle"
                    size={25}
                    color="white"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Middle column */}
          <View style={styles.artMiddleColumn}>
            <View>
              <Image
                style={styles.artMiddleTopImage}
                source={require("assets/images/empty-view/effiel-tower.webp")}
              />
              {showPlayIcons && (
                <View style={[styles.overlay, styles.overlayMiddleTop]}>
                  <Ionicons name="play-circle" size={40} color="white" />
                </View>
              )}
            </View>
            <View>
              <Image
                style={styles.artMiddleBottomImage}
                source={require("assets/images/empty-view/jamaican-beach.webp")}
              />
              {showPlayIcons && (
                <View style={[styles.overlay, styles.overlayMiddleBottom]} />
              )}
            </View>
          </View>

          {/* Right column */}
          <View style={styles.artRightColumn}>
            <View>
              <Image
                style={styles.artRightTopImage}
                source={require("assets/images/empty-view/nyc-one-tower.webp")}
              />
              {showPlayIcons && (
                <View style={[styles.overlay, styles.overlayRightTop]}>
                  <Ionicons
                    style={{ opacity: 0.8 }}
                    name="play-circle"
                    size={30}
                    color="white"
                  />
                </View>
              )}
            </View>
            <View>
              <Image
                style={styles.artRightBottomImage}
                source={require("assets/images/empty-view/costa-rican-mountain.webp")}
              />
              {showPlayIcons && (
                <View style={[styles.overlay, styles.overlayRightBottom]}>
                  <Ionicons
                    style={{ opacity: 0.8 }}
                    name="play-circle"
                    size={25}
                    color="white"
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Message */}
      {(title || description) && (
        <View style={styles.messageContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}
    </View>
  );

  // If refreshControl is provided,
  // wrap content in ScrollView
  if (refreshControl) {
    return (
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={styles.scrollContainer}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  singleImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    paddingHorizontal: 30,
  },
  singleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  artGrid: {
    opacity: 0.8,
    gap: 8,
    flexDirection: "row",
    paddingHorizontal: 30,
  },
  overlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },

  // Left Column
  artLeftColumn: {
    flex: 2,
    height: "100%",
  },
  artLeftTopImage: {
    height: "60%",
    width: "100%",
    resizeMode: "cover",
    marginTop: 20,
    opacity: 0.8,
  },
  overlayLeftTop: {
    height: "60%",
    width: "100%",
    marginTop: 20,
    top: 0,
    left: 0,
  },
  artLeftBottomImage: {
    width: "100%",
    height: "70%",
    resizeMode: "cover",
    opacity: 0.4,
    top: -35,
  },
  overlayLeftBottom: {
    width: "100%",
    height: "70%",
    top: -35,
    right: 0,
  },

  // Middle Column
  artMiddleColumn: {
    flex: 3,
    gap: 8,
    height: "100%",
  },
  artMiddleTopImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.8,
  },
  overlayMiddleTop: {
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  artMiddleBottomImage: {
    width: "100%",
    height: "25%",
    resizeMode: "cover",
    opacity: 0.25,
  },
  overlayMiddleBottom: {
    width: "100%",
    height: "25%",
    top: 0,
    left: 0,
  },
  // Right Column
  artRightColumn: {
    flex: 2,
    height: "100%",
    display: "flex",
  },
  artRightTopImage: {
    height: "70%",
    width: "100%",
    resizeMode: "cover",
    opacity: 0.9,
    marginTop: 30,
  },
  overlayRightTop: {
    height: "70%",
    width: "100%",
    marginTop: 30,
    top: 0,
    left: 0,
  },
  artRightBottomImage: {
    height: "55%",
    width: "100%",
    resizeMode: "cover",
    opacity: 0.5,
    top: -18,
  },
  overlayRightBottom: {
    height: "55%",
    width: "100%",
    top: -18,
    left: 0,
  },
  messageContainer: {
    marginTop: 35,
  },
  title: {
    fontSize: 24,
    color: "#000",
    marginBottom: 5,
    fontWeight: "bold",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 26,
    color: "#667",
    textAlign: "center",
    fontWeight: "300",
  },
});
