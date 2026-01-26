// External Dependencies
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ProfileIcon } from "@/components/ProfileIcon";
import { DEFAULT_AVATAR } from "@/libs/constants";
import type { Vote, WishlistNote } from "@/libs/types/Wishlists/Wishlist";
// Internal Dependencies
import { formatRelativeTime } from "@/libs/utils";
import { useAuthStore } from "@/stores/authStore";

interface NotesProps {
  notes: WishlistNote[];
  votes: {
    totalUpVotes: number;
    totalDownVotes: number;
    userVote?: Vote;
  };
  onAddNote?: () => void;
  onEditNote?: (note: WishlistNote) => void;
  onVote?: (noteId: string, vote: "up" | "down") => void;
}

export const Notes: React.FC<NotesProps> = ({
  notes,
  votes,
  onAddNote,
  onEditNote,
  onVote,
}) => {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  const { userVote, totalUpVotes, totalDownVotes } = votes;

  // Count notes by current user
  const totalNotesCount = notes.length;
  const userNoteCount = notes.filter((note) => note.userId === userId).length;
  const addNoteButtonText =
    userNoteCount > 0
      ? `${totalNotesCount} note${totalNotesCount !== 1 ? "s" : ""}`
      : "Add note";

  const handleAddNote = () => {
    if (onAddNote) {
      onAddNote();
    }
  };

  const handleNotePress = (note: WishlistNote) => {
    // Only allow editing own notes
    if (userId === note.userId && onEditNote) {
      onEditNote(note);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Add Note and Vote Summary */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAddNote} style={styles.addNoteButton}>
          <Text
            style={[
              styles.addNoteButtonText,
              userNoteCount === 0 && styles.addNoteButtonTextLink,
            ]}
          >
            {addNoteButtonText}
          </Text>
        </TouchableOpacity>

        <View style={styles.voteSummary}>
          {/* Upvote */}
          <View
            style={[
              styles.voteButton,
              userVote === "up" && styles.voteButtonHighlighted,
            ]}
          >
            <Text>👍</Text>
            {totalUpVotes > 0 && (
              <Text style={styles.voteCount}>{totalUpVotes}</Text>
            )}
          </View>

          {/* Divider - only show if user hasn't voted */}
          {!userVote && <View style={styles.voteDivider} />}

          {/* Downvote */}
          <View
            style={[
              styles.voteButton,
              userVote === "down" && styles.voteButtonHighlighted,
            ]}
          >
            <Text>👎</Text>
            {totalDownVotes > 0 && (
              <Text style={styles.voteCount}>{totalDownVotes}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Divider - only show if there are notes */}
      {notes.length > 0 && <View style={styles.divider} />}

      {/* Notes List */}
      {notes.length > 0 &&
        notes.map((note, index) => {
          const isOwnNote = userId === note.userId;
          const isEditable = isOwnNote && onEditNote;

          return (
            <View key={note.id}>
              <View style={styles.noteItem}>
                {/* Avatar with vote indicator */}
                <View style={styles.avatarContainer}>
                  <ProfileIcon
                    size={30}
                    imageUrl={note.profilePictureUri ?? DEFAULT_AVATAR}
                    letter={note.name.charAt(0).toUpperCase()}
                  />
                  {/* Vote indicator badge */}
                  {note.vote === "up" && (
                    <View style={styles.voteBadge}>
                      <Text style={styles.voteBadgeText}>👍</Text>
                    </View>
                  )}
                  {note.vote === "down" && (
                    <View style={styles.voteBadge}>
                      <Text style={styles.voteBadgeText}>👎</Text>
                    </View>
                  )}
                </View>

                {/* Note Content */}
                <View style={styles.noteContent}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.userName}>{note.name}</Text>
                    <Text style={styles.timestamp}>
                      · {formatRelativeTime(note.timestamp) ?? "now"}
                    </Text>
                  </View>
                  <View style={styles.noteTextContainer}>
                    <Text style={styles.noteText}>
                      {note.text ? note.text : "Voted"}{" "}
                      {isEditable && (
                        <Text
                          style={styles.editLink}
                          onPress={() => handleNotePress(note)}
                        >
                          Edit
                        </Text>
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider between notes */}
              {index < notes.length - 1 && <View style={styles.noteDivider} />}
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addNoteButton: {
    paddingVertical: 4,
  },
  addNoteButtonText: {
    fontSize: 15,
    color: "#667",
  },
  addNoteButtonTextLink: {
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  voteSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  voteDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e5e5e5",
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  voteButtonHighlighted: {
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#D4A574",
  },
  voteCount: {
    fontSize: 14,
    color: "#667",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 16,
  },
  noteItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  noteItemHighlightedUp: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: -12,
    marginVertical: -4,
  },
  noteItemHighlightedDown: {
    padding: 12,
    borderRadius: 12,
    marginVertical: -4,
    marginHorizontal: -12,
    backgroundColor: "#FFEBEE",
  },
  avatarContainer: {
    position: "relative",
  },
  voteBadge: {
    position: "absolute",
    right: -6,
    bottom: 0,
    width: 20,
    height: 20,
    elevation: 4,
    shadowRadius: 4,
    borderWidth: 1,
    borderRadius: 11,
    shadowOpacity: 0.2,
    shadowColor: "#000",
    alignItems: "center",
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
  },
  voteBadgeText: {
    fontSize: 10,
  },
  noteContent: {
    flex: 1,
    gap: 2,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  timestamp: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
    fontWeight: "400",
  },
  noteTextContainer: {
    flexDirection: "row",
  },
  noteText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#000",
  },
  editLink: {
    fontSize: 13,
    color: "#222",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  noteDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
    marginLeft: 52,
  },
});
