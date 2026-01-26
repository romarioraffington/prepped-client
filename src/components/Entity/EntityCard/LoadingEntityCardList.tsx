// External dependencies
import { StyleSheet, View } from "react-native";

// Internal dependencies
import { LoadingEntityCard } from "./LoadingEntityCard";

export const LoadingEntityCardList = ({
  loadingItemsCount = 5,
}: {
  loadingItemsCount?: number;
}) => {
  return (
    <View style={styles.container}>
      {Array(loadingItemsCount)
        .fill(0)
        .map((_, index) => (
          <View key={index}>
            <LoadingEntityCard />
            {index < loadingItemsCount - 1 && <View style={styles.separator} />}
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  separator: {
    height: 1,
    marginBottom: 15,
    backgroundColor: "#E5E5E5",
  },
});
