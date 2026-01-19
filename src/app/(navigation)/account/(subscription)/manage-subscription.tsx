// External Dependencies
import React, { useEffect } from "react";
import { router } from "expo-router";
import Animated from "react-native-reanimated";

import {
  View,
  Text,
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";


// Internal Dependencies
import { Colors } from "@/libs/constants";
import { useSubscription } from "@/contexts";
import { useSubscriptionStatus } from "@/hooks";
import { formatDate, reportError } from "@/libs/utils";
import { ChevronForward, ProBadge, WithPullToRefresh, PinterestRefreshIndicator } from "@/components";

export default function ManageSubscription() {
  const {
    subscriptionTier,
    expirationDate,
    isInitialized,
    isAutoRenewEnabled,
    hasActiveSubscription,
  } = useSubscriptionStatus();

  const {
    offerings,
    purchasePackage,
    restorePurchases,
    refreshSubscriptionStatus,
  } = useSubscription();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  // Force refresh subscription status on mount to ensure we have the latest data
  useEffect(() => {
    refreshSubscriptionStatus().catch((error) => {
      reportError(error, {
        component: "ManageSubscription",
        action: "Refresh Subscription Status on Mount",
      });
    });
  }, []); // Empty dependency array - only run on mount

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error: any) {
      reportError(error, {
        component: "ManageSubscription",
        action: "Restore Purchases",
      });
      Alert.alert('Restore Failed', error.message || 'Failed to restore purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle manage subscription (redirect to App Store/Google Play)
  const handleManageSubscription = async () => {
    try {
      // For iOS, open App Store subscription management
      const url = 'https://apps.apple.com/account/subscriptions';
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'Please go to Settings > Apple ID > Subscriptions to manage your subscription.'
        );
      }
    } catch (error) {
      reportError(error, {
        component: "ManageSubscription",
        action: "Open Subscription Management",
      });
      Alert.alert(
        'Manage Subscription',
        'Please go to Settings > Apple ID > Subscriptions to manage your subscription.'
      );
    }
  };

  // Handle subscribe/purchase
  const handleSubscribe = async () => {
    router.push("/subscription-paywall");
  };

  // Handle topping up
  const handleToppingUp = async () => {
    router.push("/credits-paywall");
  };

  // Don't show the plan section if there's no active subscription
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscriptionStatus();
    } catch (error) {
      reportError(error, {
        component: "ManageSubscription",
        action: "Refresh Subscription Status",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const subscriptionContent = (
    <View style={styles.contentContainer}>
      {/* Description */}
      <Text style={styles.description}>
        👋 Tripster, save unlimited recommendations, organize trips with ease, and get early access to new Premium features as they launch.
      </Text>

      {/* Cancel Text */}
      <Text style={[styles.description]}>
        Cancel anytime, right here in the app—no emails or forms needed.
      </Text>

      {/* Plan Details */}
      {hasActiveSubscription && (
        <View style={styles.planSection}>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <View style={styles.planValueContainer}>
              <ProBadge text={subscriptionTier.toUpperCase()} />
            </View>
          </View>
          <View style={styles.planRow}>
            <Text style={[styles.planLabel, { color: isAutoRenewEnabled ? Colors.primary : '#DC2626' }]}>{isAutoRenewEnabled ? 'Renews' : 'Expiring'}</Text>
            <Text style={[styles.planValue, { color: isAutoRenewEnabled ? Colors.primary : '#DC2626' }]}>{formatDate(expirationDate)}</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>

        {/* Subscribe */}
        {!hasActiveSubscription && (
          <TouchableOpacity style={styles.actionItem} onPress={handleSubscribe}>
            <View style={styles.actionContent}>
              <View>
                <Text style={[styles.actionTitle, styles.highlightText]}>Subscribe ✨</Text>
                <Text style={styles.actionSubtitle}>Subscibe for unlimited imports</Text>
              </View>
            </View>
            <ChevronForward />
          </TouchableOpacity>
        )}

        {/* Turn on auto-renew */}
        {hasActiveSubscription && !isAutoRenewEnabled && (
          <TouchableOpacity style={styles.actionItem} onPress={handleManageSubscription}>
            <View>
              <Text style={styles.actionTitle}>Turn on auto-renew</Text>
              <Text style={styles.actionSubtitle}>Enable auto-renew to avoid losing access</Text>
            </View>
            <ChevronForward />
          </TouchableOpacity>
        )}

        {/* Topup Credits */}
        {!hasActiveSubscription && (
          <TouchableOpacity style={styles.actionItem} onPress={handleToppingUp}>
            <View style={styles.actionContent}>
              <View>
                <Text style={styles.actionTitle}>Add Credits</Text>
                <Text style={styles.actionSubtitle}>Purchase additional imports credts</Text>
              </View>
            </View>
            <ChevronForward />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionItem, isRestoring && styles.disabledItem]}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
        >
          <View style={styles.actionContent}>
            {isRestoring && <ActivityIndicator size="small" color={Colors.primary} style={styles.loadingIndicator} />}
            <Text style={styles.actionTitle}>
              {isRestoring ? 'Restoring Purchase...' : 'Restore Purchase'}
            </Text>
          </View>
          {!isRestoring && <ChevronForward />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleManageSubscription}>
          <Text style={styles.actionTitle}>Manage Subscription</Text>
          <ChevronForward />
        </TouchableOpacity>

        {hasActiveSubscription && isAutoRenewEnabled && (
          <TouchableOpacity style={styles.actionItem} onPress={handleManageSubscription}>
            <View>
              <Text style={styles.actionTitle}>Cancel Subscription</Text>
              <Text style={styles.actionSubtitle}>Access remains until billing period ends</Text>
            </View>
            <ChevronForward />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <WithPullToRefresh
        refreshComponent={<PinterestRefreshIndicator />}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        refreshViewBaseHeight={400}
        hapticFeedbackDirection="to-bottom"
        backAnimationDuration={700}
      >
        <Animated.FlatList
          data={[{}]}
          renderItem={() => subscriptionContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </WithPullToRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    gap: 25,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#667',
    lineHeight: 24,
    fontWeight: '300',
  },
  cancelDescriptionText: {
    marginTop: -10,
    fontSize: 16,
    color: '#667',
    lineHeight: 24,
    fontWeight: '300',
  },
  planSection: {
    gap: 12,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#FAF5FF',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planLabel: {
    fontSize: 16,
    color: '#717171',
    fontWeight: '400',
  },
  planValue: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: '#F3E5FF',
  },
  actionItem: {
    gap: 10,
    paddingVertical: 18,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: '#F3E5FF',
  },
  actionTitle: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#717171',
    marginTop: 2,
    maxWidth: 260,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cancelText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingIndicator: {
    marginRight: 4,
  },
  disabledItem: {
    opacity: 0.6,
  },
});
