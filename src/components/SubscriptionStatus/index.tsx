// External Dependencies
import type React from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LucideCoins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Internal Dependencies
import { ProBadge } from '../ProBadge';
import { useImportQuota } from '@/api';
import { Colors } from '@/libs/constants';
import { formatDate } from '@/libs/utils/date';
import { useSubscriptionStatus } from '@/hooks';
import { ChevronForward } from '../ChevronForward';


export const SubscriptionStatus = () => {
  const {
    isInitialized,
    expirationDate,
    subscriptionTier,
    isAutoRenewEnabled,
    isOperationInProgress,
    hasActiveSubscription,
  } = useSubscriptionStatus()

  const { data: importQuota, isLoading: isQuotaLoading } = useImportQuota()

  const handleUpgradePress = () => {
    router.push("/account/manage-subscription");
  }

  const handleManageSubscriptionPress = () => {
    router.push("/account/manage-subscription");
  }

  if (!isInitialized || isOperationInProgress) {
    return null;
  }

  if (hasActiveSubscription) {
    return (
      <View style={styles.activeSubscriptionContainer}>
        <TouchableOpacity style={styles.subscriptionInfoSection} onPress={handleManageSubscriptionPress}>
          <ProBadge text={subscriptionTier.toUpperCase()} />
          <View style={styles.subscriptionInfoTextContainer}>
            <Text style={styles.subscriptionInfoSubscribedTitle}>Tripster 👋</Text>
            <Text style={[styles.subscribedInfoSubscribedSubtitle, { color: isAutoRenewEnabled ? Colors.primaryPurple : '#DC2626' }]}>
              {isAutoRenewEnabled ? 'Renews on' : 'Expires on'} {formatDate(expirationDate)}
            </Text>
          </View>
          <ChevronForward color={Colors.primaryPurple} />
        </TouchableOpacity>
      </View>
    )
  }


  const creditBalanceRemaining = importQuota?.creditBalanceRemaining ?? 0;
  const showImportCount = !hasActiveSubscription && importQuota && !isQuotaLoading

  // Check if the quota is full
  const isQuotaFull = creditBalanceRemaining <= 0

  // Calculate import count text
  const importCountText = isQuotaFull
    ? `You have no import credits remaining`
    : `${creditBalanceRemaining} import credits remaining`

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.upsellSection} onPress={handleUpgradePress}>
        {/* Background Image */}
        <Image
          contentFit="cover"
          style={styles.backgroundImage}
          source={require('~/assets/images/suitcase/suitcase-with-coins-no-bg.webp')}
        />

        {/* Gradient Overlay */}
        <LinearGradient
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientOverlay}
          colors={['#FAF5FF', '#F5F0FF', '#F0EBFF']}
        />

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.upsellHeading}>
            {showImportCount && (
              <View style={styles.importCountContainer}>
                <View style={styles.importCountRow}>
                  <LucideCoins size={20} color="#9333EA" strokeWidth={2} />
                  <Text style={styles.importCountText}>
                    {importCountText}
                  </Text>
                </View>
              </View>
            )}
            <ChevronForward color="#9333EA" />
          </View>

          <Text style={styles.upsellSubheading}>
            Subscribe for unlimited imports {'\n'}and early access to new features.
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    padding: 16,
  },

  // Active Subscription Secion
  activeSubscriptionContainer: {
    gap: 20,
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    borderColor: "#F3E5FF",
  },
  subscriptionInfoSection: {
    gap: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subscriptionInfoTextContainer: {
    gap: 4,
    flex: 1,
  },
  subscriptionInfoSubscribedTitle: {
    fontSize: 21,
    fontWeight: "600",
    color: Colors.primaryPurple,
  },
  subscribedInfoSubscribedSubtitle: {
    fontSize: 14,
    color: Colors.primaryPurple,
    fontWeight: "400",
  },

  // Upsell Section
  upsellSection: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "#E9D5FF",
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    right: 18,
    top: 0,
    bottom: 0,
    width: '32%',
    opacity: 0.4,
    zIndex: 10,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentContainer: {
    gap: 12,
    paddingLeft: 16,
    paddingRight: 5,
    paddingVertical: 16,
    position: 'relative',
    zIndex: 1,
  },
  upsellHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upsellTitleContainer: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  upsellTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.primaryPurple,
  },
  upsellSubheading: {
    fontSize: 15,
    color: Colors.primaryPurple,
    fontWeight: "300",
    flexWrap: "wrap",
    lineHeight: 20,
  },
  importCountContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  importCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  importCountText: {
    fontSize: 17,
    color: "#9333EA",
    fontWeight: "500",
  },
  refreshButton: {
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#7F8C8D',
    fontSize: 12,
    textAlign: 'center',
  },
});
