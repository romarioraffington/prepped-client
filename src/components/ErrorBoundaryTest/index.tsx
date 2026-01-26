import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ErrorBoundaryTestProps {
  shouldThrow?: boolean;
}

export const ErrorBoundaryTest: React.FC<ErrorBoundaryTestProps> = ({
  shouldThrow = false,
}) => {
  if (shouldThrow) {
    throw new Error("Test error for error boundary!");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error Boundary Test</Text>
      <Text style={styles.description}>
        This component can throw an error to test the error boundary.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          throw new Error("Manual test error!");
        }}
      >
        <Text style={styles.buttonText}>Throw Error</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#ff6b6b",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
