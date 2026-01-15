// External Dependencies
import { useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function RecentlyViewedScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLargeTitle: false,
      headerTitle: "Recently viewed",
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recently viewed</Text>
      <Text style={styles.subtitle}>Homes you’ve checked out in the last 30 days will appear here.</Text>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Start exploring</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

