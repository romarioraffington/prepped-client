// External Dependencies
import { useCallback } from 'react';
import { BlurView } from 'expo-blur';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

interface BlurBackButtonProps {
  isScrolled?: boolean;
  style?: ViewStyle;
}

// Reusable back button component with blur when liquid glass is not available
export function BlurBackButton({ isScrolled = false, style }: BlurBackButtonProps) {
  const navigation = useNavigation();
  const shouldShowBlur = !isLiquidGlassAvailable() && !isScrolled;

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback if can't go back
      navigation.navigate('(tabs)' as never);
    }
  }, [navigation]);

  const blurIntensity = shouldShowBlur ? 80 : 0;

  return (
    <TouchableOpacity
      onPress={handleBackPress}
      style={[styles.buttonContainer, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >

      {isLiquidGlassAvailable() ? (
        <Ionicons style={{ left: -2, top: -1 }} name="chevron-back" size={28} color="#000" />
      ) : (
        <>
          <BlurView
            tint="light"
            intensity={blurIntensity}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons style={{ left: -1, top: 1 }} name="chevron-back" size={25} color="#000" />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 38,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
