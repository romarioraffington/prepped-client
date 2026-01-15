import { useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";

export default function Edit() {
  const {
    firstName: initialFirstName,
    lastName: initialLastName
  } = useLocalSearchParams<{
    firstName: string;
    lastName: string;
  }>();

  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");

  const handleUpdate = () => {
    // TODO: Implement the update logic here
    router.back();
  };

  const clearFirstName = () => setFirstName("");
  const clearLastName = () => setLastName("");
  const isDisabled = !firstName || !lastName || (firstName === initialFirstName && lastName === initialLastName);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>Name</Text>
          <Text style={styles.description}>
            This is the name you would like other people to use when referring to you.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>First name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
              />
              {firstName.length > 0 && (
                <Pressable onPress={clearFirstName}>
                  <AntDesign name="close-circle" size={18} color="black" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
              />
              {lastName.length > 0 && (
                <Pressable onPress={clearLastName}>
                  <AntDesign name="close-circle" size={18} color="black" />
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            style={[
              styles.updateButton,
              isDisabled && styles.updateButtonDisabled
            ]}
            onPress={handleUpdate}
            disabled={isDisabled}
          >
            <Text style={styles.updateButtonText}>Update</Text>
          </Pressable>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    flex: 1,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  updateButton: {
    padding: 16,
    borderRadius: 5,
    marginTop: 130,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  updateButtonDisabled: {
    opacity: 0.3,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
