// External Dependencies
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MAX_NAME_LENGTH = 50;

export interface WishlistFormProps {
  /** The title displayed in the header (e.g., "Create wishlist" or "Rename wishlist") */
  title: string;
  /** Default value for the input field (used for rename scenario) */
  defaultValue?: string;
  /** Text for the save button (e.g., "Create" or "Save") */
  saveButtonText: string;
  /** Text shown while saving (e.g., "Creating..." or "Saving...") */
  savingButtonText?: string;
  /** Whether the form is in a loading/saving state */
  isLoading?: boolean;
  /** Callback when save button is pressed */
  onSave: (name: string) => void;
  /** Callback when cancel button is pressed */
  onCancel: () => void;
  /** Callback when back button is pressed (defaults to onCancel if not provided) */
  onBack?: () => void;
}

export function WishlistForm({
  title,
  defaultValue = "",
  saveButtonText,
  savingButtonText,
  isLoading = false,
  onSave,
  onCancel,
  onBack,
}: WishlistFormProps) {
  const [name, setName] = useState(defaultValue);
  const [characterCount, setCharacterCount] = useState(defaultValue.length);

  // Update state when defaultValue changes (e.g., when data loads)
  useEffect(() => {
    setName(defaultValue);
    setCharacterCount(defaultValue.length);
  }, [defaultValue]);

  const handleNameChange = useCallback((text: string) => {
    if (text.length <= MAX_NAME_LENGTH) {
      setName(text);
      setCharacterCount(text.length);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim() || isLoading) {
      return;
    }
    onSave(name.trim());
  }, [name, isLoading, onSave]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      onCancel();
    }
  }, [onBack, onCancel]);

  const isSaveDisabled = isLoading || !name.trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={handleNameChange}
            autoFocus
            maxLength={MAX_NAME_LENGTH}
          />
          <Text style={styles.characterCount}>
            {characterCount}/{MAX_NAME_LENGTH} characters
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
          <Text
            style={[
              styles.saveButtonText,
              isSaveDisabled && styles.saveButtonTextDisabled,
            ]}
          >
            {isLoading
              ? (savingButtonText ?? `${saveButtonText}...`)
              : saveButtonText}
          </Text>
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
  cancelButton: {
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 22,
    alignItems: "center",
    backgroundColor: "#222",
    justifyContent: "center",
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
