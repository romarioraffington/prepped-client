// External Dependencies
import { StyleSheet, View } from "react-native";

// Internal Dependencies
import { DotsLoader, SingleInputForm } from "@/components";

interface NoteFormProps {
  defaultValue?: string;
  onSave: (text: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export const NoteForm = ({
  onSave,
  onDelete,
  onCancel,
  defaultValue = "",
  isLoading = false,
  isEditing = false,
}: NoteFormProps) => {
  const handleSave = async (text: string) => {
    await onSave(text);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  // Show full-screen loading spinner if loading and we don't have a defaultValue yet
  // (meaning we're fetching initial data, not performing a mutation)
  if (isLoading && !defaultValue) {
    return (
      <View style={styles.loadingContainer}>
        <DotsLoader />
      </View>
    );
  }

  return (
    <SingleInputForm
      maxLength={250}
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={isLoading}
      headerCloseButton={true}
      defaultValue={defaultValue}
      title={isEditing ? "Edit note" : "Add note"}
      leftButtonText={isEditing ? "Delete" : "Clear"}
      onLeftButtonPress={isEditing ? handleDelete : undefined}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
