// External Dependencies
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "react-native-portalize";
import React, { forwardRef, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";

// Internal Dependencies
import { Colors } from "@/libs/constants";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type ActionBottomSheetMenuItem = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  hidden?: boolean;
  disabled?: boolean;
  destructive?: boolean;
};

export type ActionBottomSheetProps = {
  snapPoints: (string | number)[];
  index?: number;
  headerTitle?: string;
  headerImageUri?: string | null;
  menuItems?: Array<ActionBottomSheetMenuItem | null | undefined | false>;
  onChange?: (index: number) => void;
  onAnimationCompleted?: () => void;
};

const PREVIEW_IMAGE_WIDTH = 110;
const PREVIEW_IMAGE_HIDDEN_TRANSLATE_Y = 0;
const PREVIEW_IMAGE_VISIBLE_TRANSLATE_Y = -90;
const PREVIEW_IMAGE_TRANSLATE_X = -PREVIEW_IMAGE_WIDTH / 2;

export const ActionBottomSheet = forwardRef<
  BottomSheet,
  ActionBottomSheetProps
>((props, ref) => {

  const {
    snapPoints,
    index = -1,
    headerTitle,
    headerImageUri,
    menuItems,
    onChange,
    onAnimationCompleted,
  } = props;

  const imageTranslateY = useRef(new Animated.Value(PREVIEW_IMAGE_VISIBLE_TRANSLATE_Y)).current;
  const closeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleOnAnimate = (fromIndex: number, toIndex: number) => {
    if (toIndex === -1) {
      if (headerImageUri) {
        // Run close animation - slide image up out of view
        closeAnimRef.current = Animated.timing(imageTranslateY, {
          toValue: PREVIEW_IMAGE_HIDDEN_TRANSLATE_Y,
          duration: 300,
          useNativeDriver: true,
        });
        closeAnimRef.current.start(() => {
          if (onAnimationCompleted) onAnimationCompleted();
          closeAnimRef.current = null;
        });
      } else {
        if (onAnimationCompleted) onAnimationCompleted();
      }
    } else if (toIndex >= 0) {
      // Cancel any running close animation and set to visible position
      if (closeAnimRef.current) {
        closeAnimRef.current.stop();
        closeAnimRef.current = null;
      }
      imageTranslateY.setValue(PREVIEW_IMAGE_VISIBLE_TRANSLATE_Y);
    }
  };

  const handleClose = () => {
    // Close via ref; parent must pass ref
    // @ts-expect-error ref is forwarded from parent
    ref?.current?.close?.();
  };

  const itemsToRender = useMemo(
    () => (menuItems ?? []).filter((m): m is ActionBottomSheetMenuItem => !!m && !m.hidden),
    [menuItems],
  );
  const hasMenu = itemsToRender.length > 0;

  return (
    <Portal>
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        handleComponent={headerImageUri ? () => (
          <View style={styles.previewImageContainer}>
            <Animated.View style={[styles.previewImage, { transform: [{ translateY: imageTranslateY }] }]}>
              <Image
                contentFit="cover"
                transition={200}
                source={{ uri: headerImageUri }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        ) : undefined}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            enableTouchThrough
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
        onAnimate={handleOnAnimate}
        onChange={(index) => {
          if (index === 0) {
            if (closeAnimRef.current) {
              closeAnimRef.current.stop();
              closeAnimRef.current = null;
            }
            imageTranslateY.setValue(PREVIEW_IMAGE_VISIBLE_TRANSLATE_Y);
          }
          if (onChange) onChange(index);
        }}
      >
        <BottomSheetView>
          <View style={styles.headerRow}>
            {headerTitle && (<Text style={styles.headerTitle}>{headerTitle}</Text>)}
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, headerImageUri && { top: 30 }]}>
              <Ionicons name="close" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {hasMenu && (
            <View style={[
              styles.menuItemContainer,
              headerTitle ? { paddingTop: 30 } : headerImageUri && { paddingTop: 90 },
            ]}>
              {itemsToRender.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.label}-${idx}`}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <Ionicons
                    size={20}
                    name={item.icon}
                    color={item.destructive ? Colors.destructive : "#667"}
                  />
                  <Text style={[
                    styles.menuItemText,
                    item.destructive && styles.menuItemTextDestructive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
},
);

export default ActionBottomSheet;

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  handleIndicator: {
    display: "none",
  },
  previewImageContainer: {
    top: 0,
    left: "50%",
    position: "absolute",
    transform: [{
      translateX: PREVIEW_IMAGE_TRANSLATE_X,
    }],
  },
  previewImage: {
    height: 160,
    overflow: "hidden",
    borderRadius: 15,
    width: PREVIEW_IMAGE_WIDTH,
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
  },
  headerRow: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    color: "#000",
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    top: 0,
    left: 20,
    opacity: 0.5,
    position: "absolute",
  },
  menuItemContainer: {
    gap: 25,
    paddingBottom: 45,
    paddingHorizontal: 20,
    flexDirection: "column",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 17,
    color: "#000",
    marginLeft: 8,
    fontWeight: "500",
  },
  menuItemTextDestructive: {
    color: Colors.destructive,
  },
});


