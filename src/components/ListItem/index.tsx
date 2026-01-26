import {
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

import {
  type AntDesign,
  type Feather,
  Ionicons,
  type MaterialCommunityIcons,
  type MaterialIcons,
} from "@expo/vector-icons";

type IconComponentType =
  | typeof Feather
  | typeof Ionicons
  | typeof AntDesign
  | typeof MaterialIcons
  | typeof MaterialCommunityIcons;

interface ListItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  iconSize?: number;
  iconContainerStyle?: StyleProp<ViewStyle>;
  IconComponent?: IconComponentType;
  onPress?: () => void;
}

export const ListItem = ({
  icon,
  title,
  subtitle,
  iconSize = 22,
  iconContainerStyle,
  IconComponent = Ionicons,
  onPress,
}: ListItemProps) => {
  const Icon = IconComponent || Ionicons;
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemContent}>
        <View style={[styles.iconContainer, iconContainerStyle]}>
          <Icon name={icon as any} size={iconSize} color="#222222" />
        </View>
        <View>
          <Text style={styles.listItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color="grey" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listItem: {
    paddingRight: 10,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    backgroundColor: "white",
    borderBottomColor: "#DDDDDD",
    justifyContent: "space-between",
  },
  listItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 24,
    marginRight: 12,
  },
  listItemTitle: {
    fontSize: 16,
    color: "#222222",
  },
  listItemSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginTop: 2,
  },
});
