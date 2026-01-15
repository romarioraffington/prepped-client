// External Dependencies
import React, { useState, useRef } from "react";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, AppState } from "react-native";

// Internal Dependencies
import { useCompleteOnboarding } from "@/api";
import { reportError, reportWarning } from "@/libs/utils/errorReporting";

const shareSheetVideo = {
  uri: "https://cdn.tripspire.app/videos/onboarding/sharing-from-tiktok-v4.mp4",
};

export default function SharingFromTikTok() {
  const insets = useSafeAreaInsets();
  const videoViewRef = useRef<any>(null);
  const completeOnboardingMutation = useCompleteOnboarding();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(true);
  const [isTikTokOpened, setIsTikTokOpened] = useState(false);

  const player = useVideoPlayer(shareSheetVideo, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Listen for video status changes
  React.useEffect(() => {
    let loadingTimeout: ReturnType<typeof setTimeout>;

    const subscription = player.addListener('statusChange', (status) => {

      if (status.status === 'readyToPlay' || status.status === 'idle') {
        setShowLoadingIndicator(false);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      } else if (status.status === 'loading') {
        // Only show loading indicator after 500ms delay
        loadingTimeout = setTimeout(() => {
          setShowLoadingIndicator(true);
        }, 500);
      }
    });

    return () => {
      subscription?.remove();
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [player]);

  // Also listen to AppState to detect when app goes to background
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && isTikTokOpened) {
        // When app goes to background after TikTok opened, ensure video plays
        if (player && !player.playing) {
          setTimeout(() => {
            try {
              player.play();
            } catch (error) {
              // Ignore errors
            }
          }, 200);
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [player, isTikTokOpened]);

  const handleOpenTikTok = async () => {
    try {
      // Mark that we're opening TikTok
      setIsTikTokOpened(true);

      // Restart video from beginning and ensure it's playing before opening TikTok
      if (player) {
        player.currentTime = 0; // Restart from beginning
        player.play();

        // Give video a moment to start playing before opening TikTok
        // This helps establish PiP before TikTok takes focus
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const tiktokUrl = 'https://vt.tiktok.com/ZSyE2equf'
      await Linking.openURL(tiktokUrl);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      reportWarning(errorMessage, {
        component: "SharingFromTikTok",
        action: "Open TikTok",
      });
      // Silently fail - user can manually open TikTok
    }
  };

  const handleNext = async () => {
    // Stop PiP mode by pausing the video and trying to exit PiP
    try {
      if (player) {
        player.pause();
      }

      // Try to stop PiP using VideoView ref
      if (videoViewRef.current) {
        try {
          if (typeof videoViewRef.current.stopPictureInPicture === 'function') {
            videoViewRef.current.stopPictureInPicture();
          } else if (typeof videoViewRef.current.exitPictureInPicture === 'function') {
            videoViewRef.current.exitPictureInPicture();
          }
        } catch (pipError) {
          // Ignore - PiP might not be active
        }
      }

      // Also try on player directly
      if (player && typeof (player as any).stopPictureInPicture === 'function') {
        (player as any).stopPictureInPicture();
      }
    } catch (error) {
      // Ignore errors - PiP might not be active
      console.log('Error stopping PiP:', error);
    }
    try {
      // Mark onboarding as complete
      await completeOnboardingMutation.mutateAsync();
      router.replace("/");
    } catch (error) {
      reportError(error, {
        component: "SharingFromTikTok",
        action: "Complete Onboarding",
      });
      // Still navigate to home even if API call fails
      router.replace("/");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <FontAwesome5 name="share" size={24} color="white" />
            <Text style={styles.title}>Sharing from TikTok</Text>
          </View>
          <Text style={styles.subtitle}>
            Learn how to share travel recommendations to TripSpire from TikTok.
          </Text>
        </View>

        {/* Video Container */}
        <View style={styles.videoContainer}>
          <VideoView
            ref={videoViewRef}
            player={player}
            style={styles.video}
            allowsPictureInPicture={true}
            startsPictureInPictureAutomatically={true}
          />
          {showLoadingIndicator && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1.</Text>
            <Text style={styles.instructionText}>
              From Tiktok, tap the <MaterialCommunityIcons name="share" size={24} color="white" /> <Text style={styles.bold}>button.</Text>
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2.</Text>
            <Text style={styles.instructionText}>
              Select the <Text style={styles.bold}>"Share to" menu option.</Text>
            </Text>
          </View>


          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3.</Text>
            <Text style={styles.instructionText}>
              Select TripSpire from the app list.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Next Button - Always visible at bottom */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleOpenTikTok}
            style={[styles.button, styles.primaryButton]}
          >
            <Ionicons name="logo-tiktok" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Open TikTok </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            disabled={completeOnboardingMutation.isPending}
            style={[
              styles.button,
              styles.secondaryButton,
              completeOnboardingMutation.isPending && styles.disabledButton
            ]}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Done 🎉</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 28,
  },
  headerContainer: {
    marginVertical: 40,
  },
  titleRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    marginLeft: 8,
    color: "white",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: "white",
    fontWeight: "300",
    textAlign: "center",
  },
  videoContainer: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  video: {
    width: 250,
    height: 400,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 16,
    color: "white",
    lineHeight: 22,
    flex: 1,
  },
  bold: {
    fontWeight: "600",
  },
  footerText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "500",
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
  buttonRow: {
    gap: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minWidth: 0,
  },
  primaryButton: {
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  secondaryButton: {
    borderWidth: 1.5,
    backgroundColor: "#000000",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButtonText: {
    color: "white",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
