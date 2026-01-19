// External dependencies
import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Internal dependencies
import { useImportRecommendations } from "@/api/import";
import { parseSlug, capitalizeWords } from "@/libs/utils";
import { RecommendationsScreen } from "@/components/screens/RecommendationScreen";
import { DefaultRecommendationItemActions, DefaultSwipeableRecommendationItem } from "@/components/Recommendations";

type RecommendationsParams = {
  slug: string;
}

export default function Recommendations() {
  const { slug } = useLocalSearchParams<RecommendationsParams>();

  // Parse the slug to get ID and name
  const { name: slugName, id: recipeId } = parseSlug(slug);

  const {
    data,
    isLoading,
  } = useImportRecommendations(recipeId);

  const region = data?.region;
  const recommendations = data?.recommendations || [];
  const displayName = data?.name ? data?.name : capitalizeWords(slugName);

  // Create subtitle component with recipe icon
  function RecipeSubtitle() {
    return (
      <View style={styles.subtitleContainer}>
        <MaterialCommunityIcons
          size={18}
          color="#FF6B35"
          name="chef-hat"
          style={styles.subtitleIcon}
        />
        <Text style={styles.subtitleText}>Recipe</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RecommendationsScreen
        region={region}
        name={displayName}
        isLoading={isLoading}
        subtitle={RecipeSubtitle}
        recommendations={recommendations}
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
    marginRight: 2,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FF6B35",
  },
});
