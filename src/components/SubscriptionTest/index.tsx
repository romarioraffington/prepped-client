import type React from 'react';
import { useSubscriptionStatus } from '@/hooks';
import { useSubscription, useAuth } from '@/contexts';
import { reportError } from '@/libs/utils/errorReporting';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export const SubscriptionTest: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    isInitialized,
    isOperationInProgress,
    error,
    offerings,
    purchasePackage,
    restorePurchases,
    refreshSubscriptionStatus,
    clearCache,
    setUserId
  } = useSubscription();

  const {
    isPremium,
    hasActiveSubscription,
    subscriptionTier,
    canAccessFeature
  } = useSubscriptionStatus();

  const handleTestPurchase = async () => {
    if (!offerings || offerings.length === 0) {
      Alert.alert(
        'No Offerings Available',
        'This is expected! You need to:\n\n1. Create subscription products in App Store Connect/Google Play Console\n2. Add them to RevenueCat dashboard\n3. Create offerings in RevenueCat\n\nSee REVENUECAT_SETUP.md for detailed instructions.'
      );
      return;
    }

    try {
      const firstOffering = offerings[0];
      console.log('🎯 DEBUG: Available offering:', firstOffering);

      if (firstOffering.availablePackages.length > 0) {
        const firstPackage = firstOffering.availablePackages[0];
        console.log('📦 DEBUG: Purchasing package:', firstPackage);

        await purchasePackage(firstPackage);

        // Check status after purchase
        console.log('🔍 DEBUG: After purchase - isPremium:', isPremium, 'subscriptionTier:', subscriptionTier);

        Alert.alert('Success', `Purchase completed successfully!\n\nStatus: ${subscriptionTier}\nPremium Access: ${isPremium ? 'Yes' : 'No'}`);
      } else {
        Alert.alert('No Packages', 'No packages available in the offering.');
      }
    } catch (error: any) {
      reportError(error, {
        component: "SubscriptionTest",
        action: "Test Purchase",
      });
      Alert.alert('Purchase Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleTestRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleTestRefresh = async () => {
    try {
      await refreshSubscriptionStatus();
      Alert.alert('Success', 'Subscription status refreshed!');
    } catch (error: any) {
      Alert.alert('Refresh Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleClearCache = () => {
    clearCache();
    Alert.alert('Cache Cleared', 'Subscription cache cleared. The app will reinitialize with fresh data.');
  };

  const handleTestRenewal = async () => {
    try {
      // Force refresh to check for renewal status
      await refreshSubscriptionStatus();

      Alert.alert(
        'Renewal Test',
        `Current Status:\n• Tier: ${subscriptionTier}\n• Premium Access: ${isPremium ? 'Yes' : 'No'}\n• Initialized: ${isInitialized ? 'Yes' : 'No'}\n\nThis simulates checking for subscription renewals.`
      );
    } catch (error: any) {
      Alert.alert('Renewal Test Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleTestSubscriptionLifecycle = () => {
    Alert.alert(
      'Real Device Testing Guide',
      `🧪 REAL DEVICE TESTING METHODS:

1️⃣ SANDBOX TESTING:
• Use sandbox Apple ID on real device
• Make test purchases (free in sandbox)
• Test renewals with short periods

2️⃣ TESTFLIGHT BETA:
• Upload to TestFlight
• Real App Store environment
• Test with real users

3️⃣ REVENUECAT DASHBOARD:
• Check customer info in RevenueCat
• Monitor subscription status
• Test webhook events

4️⃣ SHORT RENEWAL PERIODS:
• Set 1-minute renewals for testing
• Monitor renewal cycles
• Test expiration scenarios

Current Status: ${subscriptionTier} | Premium: ${isPremium ? 'Yes' : 'No'}`
    );
  };

  const handleTestFeatureAccess = () => {
    const freeAccess = canAccessFeature('free');
    const premiumAccess = canAccessFeature('premium');

    Alert.alert(
      'Feature Access Test',
      `Free Access: ${freeAccess ? '✅' : '❌'}\nPremium Access: ${premiumAccess ? '✅' : '❌'}\nCurrent Tier: ${subscriptionTier}`
    );
  };

  const handleTestSetUserId = async () => {
    if (!user?.id) {
      Alert.alert('No User ID', 'User is not authenticated or has no ID');
      return;
    }

    try {
      await setUserId(user.id);
      Alert.alert('Success', `User ID set successfully: ${user.id}`);
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Failed to set user ID');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RevenueCat Test Panel</Text>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          Initialized: {isInitialized ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Operation in Progress: {isOperationInProgress ? '⏳' : '✅'}
        </Text>
        <Text style={styles.statusText}>
          Error: {error || 'None'}
        </Text>
        <Text style={styles.statusText}>
          Authenticated: {isAuthenticated ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          User ID: {user?.id || 'None'}
        </Text>
        <Text style={styles.statusText}>
          Subscription: {hasActiveSubscription ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Tier: {subscriptionTier}
        </Text>
        <Text style={styles.statusText}>
          Premium: {isPremium ? '✅' : '❌'}
        </Text>
      </View>

      {/* Offerings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offerings</Text>
        <Text style={styles.statusText}>
          Count: {offerings?.length || 0}
        </Text>
        {offerings && offerings.length > 0 ? (
          <Text style={styles.statusText}>
            First Offering: {offerings[0].identifier}
          </Text>
        ) : (
          <Text style={[styles.statusText, { color: '#E74C3C' }]}>
            ⚠️ No offerings configured
          </Text>
        )}
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>

        <TouchableOpacity style={styles.button} onPress={handleTestFeatureAccess}>
          <Text style={styles.buttonText}>Test Feature Access</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#8E44AD' }]} onPress={handleTestSetUserId}>
          <Text style={styles.buttonText}>Set User ID</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleTestRefresh}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#E74C3C' }]} onPress={handleClearCache}>
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#9B59B6' }]} onPress={handleTestRenewal}>
          <Text style={styles.buttonText}>Test Renewal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#2ECC71' }]} onPress={handleTestSubscriptionLifecycle}>
          <Text style={styles.buttonText}>Testing Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleTestRestore}>
          <Text style={styles.buttonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.purchaseButton]}
          onPress={handleTestPurchase}
        >
          <Text style={styles.buttonText}>Test Purchase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2C3E50',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#34495E',
  },
  button: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  purchaseButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
