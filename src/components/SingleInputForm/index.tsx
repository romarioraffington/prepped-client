import { Ionicons } from "@expo/vector-icons";
// External Dependencies
import { router } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Internal Dependencies
import { DotsLoader } from "@/components";

export interface SingleInputFormProps {
  // The title displayed in the header (e.g., "Create wishlist" or "Add note")
  title: string;
  // Default value for the input field (used for edit scenario)
  defaultValue?: string;
  // Text for the save button (e.g., "Create" or "Save")
  saveButtonText?: string;
  // Whether the form is in a loading/saving state
  isLoading?: boolean;
  // Maximum character length (default: 50)
  maxLength?: number;
  // Placeholder text for the input (default: "Name")
  placeholder?: string;
  // Text for the left button (default: "Cancel"). Can be "Clear" or "Delete"
  leftButtonText?: string;
  // Callback when save button is pressed
  onSave: (value: string) => void;
  // Callback when cancel/clear/delete button is pressed (defaults to router.back() if not provided)
  onCancel?: () => void;
  // Callback when left button is pressed (when provided, overrides default onCancel behavior)
  onLeftButtonPress?: () => void;
  // Callback when back/close button is pressed (defaults to onCancel or router.back() if not provided)
  onBack?: () => void;
  // When true, shows 'X' close button on right instead of back arrow on left
  headerCloseButton?: boolean;
}

export function SingleInputForm({
  title,
  maxLength = 50,
  isLoading = false,
  defaultValue = "",
  placeholder = "Name",
  saveButtonText = "Save",
  leftButtonText = "Cancel",
  onSave,
  onCancel,
  onLeftButtonPress,
  onBack,
  headerCloseButton = false,
}: SingleInputFormProps) {
  const [value, setValue] = useState(defaultValue);
  const [characterCount, setCharacterCount] = useState(defaultValue.length);

  // Update state when defaultValue changes (e.g., when data loads)
  useEffect(() => {
    setValue(defaultValue);
    setCharacterCount(defaultValue.length);
  }, [defaultValue]);

  const handleValueChange = useCallback(
    (text: string) => {
      if (text.length <= maxLength) {
        setValue(text);
        setCharacterCount(text.length);
      }
    },
    [maxLength],
  );

  const handleSave = useCallback(() => {
    if (!value.trim() || isLoading) {
      return;
    }
    onSave(value.trim());
  }, [value, isLoading, onSave]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [onBack, onCancel]);

  const handleLeftButtonPress = useCallback(() => {
    // If button text is "Clear", clear the input instead of calling callbacks
    if (leftButtonText === "Clear") {
      setValue("");
      setCharacterCount(0);
      return;
    }

    if (onLeftButtonPress) {
      onLeftButtonPress();
    } else if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [onLeftButtonPress, onCancel, leftButtonText]);

  const isSaveDisabled = isLoading || !value.trim();
  const isLeftButtonDisabled = isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {headerCloseButton ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.closeButton}
            disabled={isLoading}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={handleValueChange}
            autoFocus
            maxLength={maxLength}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {characterCount}/{maxLength} characters
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.leftButton}
          onPress={handleLeftButtonPress}
          disabled={isLeftButtonDisabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.leftButtonText,
              isLeftButtonDisabled && styles.leftButtonTextDisabled,
            ]}
          >
            {leftButtonText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaveDisabled && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaveDisabled}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <DotsLoader
              fullHeight={false}
              backgroundColor="transparent"
              color="#fff"
              dotSize={6}
            />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                isSaveDisabled && styles.saveButtonTextDisabled,
              ]}
            >
              {saveButtonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    top: 20,
    left: 16,
    position: "absolute",
  },
  closeButton: {
    width: 40,
    height: 40,
    top: 20,
    right: 16,
    position: "absolute",
  },
  headerTitle: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  inputContainer: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    color: "#000",
    fontSize: 16,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderColor: "#C0C0C0",
    backgroundColor: "#fff",
    minHeight: 100,
  },
  characterCount: {
    fontSize: 13,
    color: "#667",
    marginLeft: 4,
    fontWeight: "700",
  },
  footer: {
    gap: 12,
    flexDirection: "row",
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    borderTopColor: "#E5E5E5",
    justifyContent: "space-between",
  },
  leftButton: {
    paddingVertical: 14,
  },
  leftButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textDecorationLine: "underline",
  },
  leftButtonTextDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 22,
    alignItems: "center",
    backgroundColor: "#222",
    justifyContent: "center",
    minHeight: 44,
  },
  saveButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  saveButtonText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "500",
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
});
