// External Dependencies
import type React from "react";
import { Feather } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Internal Dependencies
import { DEFAULT_AVATAR } from "@/libs/constants";
import { ProfileIcon } from "@/components/ProfileIcon";
import type { WishlistMember } from "@/libs/types/Wishlists/Wishlist";

interface WishlistMembersProps {
  members: WishlistMember[];
  onPress?: () => void;
}

export const WishlistMembers: React.FC<WishlistMembersProps> = ({
  members,
  onPress,
}) => {
  // Show up to 3 visible avatars, then show "+X" for remaining
  const MAX_VISIBLE = 3;

  // Filter out members with invalid IDse
  const validMembers = members.filter((member) => member.id);
  const visibleMembers = validMembers.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(0, validMembers.length - MAX_VISIBLE);

  if (validMembers.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
      disabled={!onPress}
    >
      <View style={styles.avatarsContainer}>
        {visibleMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarWrapper,
              index > 0 && styles.avatarOffset,
              { zIndex: MAX_VISIBLE - index },
            ]}
          >
            <ProfileIcon
              size={29}
              imageUrl={
                !member.profilePictureUri && !member.name
                  ? DEFAULT_AVATAR
                  : member.profilePictureUri
              }
              letter={member.name?.charAt(0).toUpperCase()}
            />
          </View>
        ))}
        {remainingCount > 0 && (
          <View
            style={[
              styles.avatarWrapper,
              styles.avatarOverflow,
              visibleMembers.length > 0 && styles.avatarOffset,
            ]}
          >
            <View style={styles.overflowContainer}>
              <Text style={styles.overflowText}>+{remainingCount}</Text>
            </View>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={15} color="#000" style={styles.chevronRight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e5e5",
    alignSelf: "flex-start",
    justifyContent: "space-between",
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  avatarOffset: {
    marginLeft: -8,
  },
  avatarOverflow: {
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  overflowContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  overflowText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#222",
  },
  chevronRight: {
    marginLeft: 10,
    marginRight: 4,
  },
});

