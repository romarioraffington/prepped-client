// External dependencies
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

// Internal dependencies
import { useCollectionRecommendations } from "@/api";
import { parseSlug, capitalizeWords } from "@/libs/utils";
import { RecommendationsScreen } from "@/components/screens/RecommendationScreen";
import { DefaultRecommendationItemActions, DefaultSwipeableRecommendationItem } from "@/components/Recommendations";

type RecommendationsParams = {
  slug: string;
  category?: string;
  previousTitle?: string;
}

export default function Recommendations() {
  const { slug, category, previousTitle } = useLocalSearchParams<RecommendationsParams>();

  // Parse the slug to get ID and name
  const { name: slugName, id: cookbookId } = parseSlug(slug);

  const {
    data,
    isLoading,
  } = useCollectionRecommendations(cookbookId, category);

  const region = data?.region;
  const recommendations = data?.recommendations || [];
  const displayName = data?.name ? data?.name : capitalizeWords(slugName);

  // Create subtitle component with cookbook icon
  function CookbookSubtitle() {
    return (
      <View style={styles.subtitleContainer}>
        <FontAwesome
          size={14}
          name="book"
          color="#3B82F6"
          style={styles.subtitleIcon}
        />
        <Text style={styles.subtitleText}>Cookbook</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RecommendationsScreen
        region={region}
        isLoading={isLoading}
        previousTitle={previousTitle}
        subtitle={CookbookSubtitle}
        recommendations={recommendations}
        name={category ? category : displayName}
        renderItemActions={(props) => <DefaultRecommendationItemActions {...props} />}
        renderSwipeableItem={(props) => <DefaultSwipeableRecommendationItem {...props} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  subtitleIcon: {
    marginRight: 6,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
  },
});
