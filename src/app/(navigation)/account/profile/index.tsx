// External Imports
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

// Internal Imports
import { useAuth } from "@/contexts";
import { formatDate } from "@/libs/utils/date";
import { useSubscriptionStatus } from "@/hooks";
import { useAccountDeletionMutation } from "@/api/account/deletion";

export default function Profile() {
  const { user } = useAuth();
  const accountDeletionMutation = useAccountDeletionMutation();
  const { hasActiveSubscription, isAutoRenewEnabled, expirationDate } = useSubscriptionStatus();

  let displayName = null;
  if (user?.firstName && user?.lastName) {
    displayName = `${user.firstName} ${user.lastName}`.trim();
  }


  const handleBottomSheetDeletePress = () => {
    if (hasActiveSubscription) {
      // Show alert for subscription users
      const message = isAutoRenewEnabled
        ? "Please cancel your subscription first before deleting your account."
        : `Please wait untiil your subscription expires on ${formatDate(expirationDate)} before deleting your account.`;

      Alert.alert(
        "Oops!",
        message,
        [
          {
            isPreferred: true,
            text: "Manage",
            onPress: () => {
              router.push("/account/manage-subscription");
            }
          },
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    } else {
      // Show alert for users without subscription
      Alert.alert(
        "Delete Account",
        "This action cannot be undone and all your data will be permanently deleted.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Request",
            style: "destructive",
            onPress: () => {
              accountDeletionMutation.mutate(undefined, {
                onSuccess: (data) => {
                  Alert.alert(
                    "Request Submitted",
                    data.message,
                    [
                      {
                        text: "OK",
                        style: "default"
                      }
                    ]
                  );
                },
                onError: (error) => {
                  Alert.alert(
                    "Oops!",
                    error?.message,
                    [
                      {
                        text: "OK",
                        style: "default"
                      }
                    ]
                  );
                }
              });
            }
          }
        ]
      );
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Profile Sections */}
      <View style={styles.sections}>
        {displayName && (
          <View style={styles.section}>
            <View>
              <Text style={styles.sectionLabel}>Name</Text>
              <Text style={styles.sectionValue}>{displayName}</Text>
            </View>
          </View>
        )}

        {/* Email Section */}
        {user?.email && (
          <View style={styles.section}>
            <View>
              <Text style={styles.sectionLabel}>Email</Text>
              <View style={styles.verifiedContainer}>
                <Text style={styles.sectionValue}>{user?.email}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Delete Account Button */}
      <TouchableOpacity
        style={styles.section}
        onPress={handleBottomSheetDeletePress}
      >
        <Text style={styles.deleteText}>Delete account</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 35,
    fontWeight: "700",
    marginBottom: 30,
  },
  sections: {
    gap: 24,
    marginBottom: 40,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 16,
    color: "#667",
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteText: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "500",
  },
});
