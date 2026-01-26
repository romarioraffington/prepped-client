import { Entypo, Ionicons } from "@expo/vector-icons";
import Clipboard from "@react-native-clipboard/clipboard";
// External Dependencies
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useImportContent } from "@/hooks/useImportContent";
// Internal Dependencies
import { reportError } from "@/libs/utils";

export default function Create() {
  const { importContent } = useImportContent();

  // Functions
  const handleClosePress = () => {
    router.back();
  };

  const handleImportByLink = async () => {
    try {
      const clipboardContent = await Clipboard.getString();

      // Close the modal first
      router.back();

      // Use the abstracted import functionality
      importContent(clipboardContent);
    } catch (error) {
      reportError(error, {
        component: "CreateModal",
        action: "Import By Link",
      });
    }
  };

  const handleImportByShare = () => {
    router.back(); // Close the modal first
    router.push("/setup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClosePress}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={29} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Start importing...</Text>
        </View>

        <View style={styles.bodyContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardContainer}
            onPress={handleImportByShare}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <Text style={styles.cardMainText}>
                  Import by sharing{"\n"}from other apps
                </Text>
                <View style={styles.cardCTAContainer}>
                  <Ionicons
                    name="play-circle-outline"
                    size={16}
                    color="#8E8E93"
                  />
                  <Text style={styles.cardCTAText}>Learn more</Text>
                </View>
              </View>
              <View style={styles.cardRowRight}>
                <Image
                  contentFit="contain"
                  style={styles.shareContentImageContainer}
                  source={require("~/assets/images/import-bottom-sheet/import-by-share.gif")}
                />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.cardContainer}>
            <TouchableOpacity
              activeOpacity={0.4}
              style={styles.cardRow}
              onPress={handleImportByLink}
            >
              <View style={styles.cardRowLeft}>
                <Text style={styles.cardMainText}>
                  Import by pasting {"\n"}the content link
                </Text>
                <View style={styles.cardCTAContainer}>
                  <Entypo name="link" size={16} color="#8E8E93" />
                  <Text style={styles.cardCTAText}>Paste</Text>
                </View>
              </View>
              <View style={styles.cardRowRight}>
                <Image
                  contentFit="contain"
                  style={[styles.shareContentImageContainer, { right: -35 }]}
                  source={require("~/assets/images/import-bottom-sheet/import-by-link.png")}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 25,
    paddingTop: 8,
  },
  closeButton: {
    top: 5,
    left: 0,
    position: "absolute",
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "#000000",
    marginBottom: 6,
  },
  bodyContainer: {
    gap: 15,
    marginBottom: 30,
  },
  cardContainer: {
    padding: 20,
    height: 120,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  cardRow: {
    flexDirection: "row",
  },
  cardRowLeft: {
    flexDirection: "column",
    gap: 10,
    flex: 1,
  },
  cardRowRight: {
    flex: 1,
  },
  cardMainText: {
    fontSize: 15,
    color: "#000",
    lineHeight: 22,
    fontWeight: 500,
  },
  cardCTAContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardCTAText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  shareContentImageContainer: {
    width: 150,
    height: 120,
    right: -45,
    bottom: -38,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 30,
  },
});
