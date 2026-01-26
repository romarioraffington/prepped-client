import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ThankYou() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const handleClose = () => {
    Haptics.selectionAsync();

    if (returnTo === "recipes") {
      router.push("/");
    } else {
      router.push("/account");
    }

    router.dismissAll();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Thanks for letting us know</Text>
        <Text style={styles.subtitle}>
          {" "}
          We'll use your feedback to help us improve 💖
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleClose} style={styles.button}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    marginTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 38,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 17,
    marginTop: 40,
    color: "#333",
  },
  footer: {
    padding: 16,
    borderTopColor: "#EBEBEB",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
