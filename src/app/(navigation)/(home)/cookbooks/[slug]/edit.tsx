// External Dependencies
import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

// Internal Dependencies
import { Colors } from "@/libs/constants";
import { parseSlug, capitalizeWords } from "@/libs/utils";

type EditParams = {
  slug: string;
};

export default function EditCookbook() {
  const { slug } = useLocalSearchParams<EditParams>();
  const { name: slugName } = parseSlug(slug);
  const displayName = capitalizeWords(slugName);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Recipes in {displayName}</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#667",
  },
});
