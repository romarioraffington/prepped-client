import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
// External Dependencies
import React from "react";

export const getIconForOffering = (offeringName: string, color = "#687076") => {
  const name = offeringName.toLowerCase();
  const iconProps = { size: 24, color };

  // Food & Beverage
  if (name.includes("beer"))
    return <Ionicons name="beer" {...iconProps} size={24} />;
  if (name.includes("wine"))
    return <Ionicons name="wine" {...iconProps} size={26} />;
  if (name.includes("cocktail"))
    return <Fontisto name="cocktail" {...iconProps} size={24} />;
  if (name.includes("coffee"))
    return <Ionicons name="cafe-sharp" {...iconProps} size={28} />;
  if (name.includes("dessert"))
    return <Ionicons name="ice-cream" {...iconProps} />;
  if (name.includes("vegetarian"))
    return <Ionicons name="leaf" {...iconProps} />;

  // Dining Options
  if (name.includes("takeout"))
    return <MaterialIcons name="takeout-dining" {...iconProps} size={28} />;
  if (name.includes("dine-in"))
    return (
      <MaterialCommunityIcons
        name="silverware-clean"
        {...iconProps}
        size={25}
      />
    );
  if (name.includes("table service"))
    return <Ionicons name="restaurant" {...iconProps} />;
  if (name.includes("curbside"))
    return <Ionicons name="car" {...iconProps} size={28} />;
  if (name.includes("delivery"))
    return <MaterialIcons name="delivery-dining" {...iconProps} size={29} />;

  // Entertainment & Activities
  if (name.includes("live music"))
    return <FontAwesome6 name="drum" {...iconProps} />;
  if (name.includes("outdoor"))
    return <Ionicons name="sunny" {...iconProps} size={31} />;

  // Accessibility & Demographics
  if (name.includes("wheelchair"))
    return <FontAwesome name="wheelchair-alt" {...iconProps} size={22} />;
  if (name.includes("family"))
    return <MaterialIcons name="family-restroom" {...iconProps} />;
  if (name.includes("groups"))
    return <FontAwesome6 name="people-group" {...iconProps} size={23} />;

  // Payment Methods
  if (name.includes("cards"))
    return <FontAwesome name="credit-card-alt" {...iconProps} size={17} />;
  if (name.includes("cash"))
    return <Ionicons name="cash-sharp" {...iconProps} size={25} />;

  // Facilities & Services
  if (name.includes("restroom"))
    return <FontAwesome5 name="toilet" {...iconProps} size={22} />;
  if (name.includes("parking"))
    return <MaterialIcons name="local-parking" {...iconProps} />;
  if (name.includes("reservation"))
    return <Ionicons name="calendar" {...iconProps} size={24} />;

  if (name.includes("sports"))
    return <MaterialIcons name="sports-handball" {...iconProps} size={30} />;

  // Default icon
  return <Ionicons name="checkmark-circle" {...iconProps} size={27} />;
};

export const getOfferingGroupName = (name: string) => {
  const lowerName = name.toLowerCase();

  // Food & Beverage
  if (
    lowerName.includes("beer") ||
    lowerName.includes("wine") ||
    lowerName.includes("cocktail") ||
    lowerName.includes("coffee") ||
    lowerName.includes("dessert") ||
    lowerName.includes("vegetarian") ||
    lowerName.includes("food") ||
    lowerName.includes("drink")
  ) {
    return "Food & Beverage";
  }

  // Dining Options
  if (
    lowerName.includes("takeout") ||
    lowerName.includes("dine-in") ||
    lowerName.includes("table service") ||
    lowerName.includes("curbside") ||
    lowerName.includes("delivery")
  ) {
    return "Dining Options";
  }

  // Entertainment & Activities
  if (
    lowerName.includes("live music") ||
    lowerName.includes("outdoor") ||
    lowerName.includes("entertainment")
  ) {
    return "Entertainment & Activities";
  }

  // Accessibility & Demographics
  if (
    lowerName.includes("wheelchair") ||
    lowerName.includes("family") ||
    lowerName.includes("groups") ||
    lowerName.includes("accessibility")
  ) {
    return "Accessibility & Demographics";
  }

  // Payment Methods
  if (
    lowerName.includes("cards") ||
    lowerName.includes("cash") ||
    lowerName.includes("payment")
  ) {
    return "Payment Methods";
  }

  // Facilities & Services
  if (
    lowerName.includes("restroom") ||
    lowerName.includes("parking") ||
    lowerName.includes("reservation") ||
    lowerName.includes("facilities") ||
    lowerName.includes("services")
  ) {
    return "Facilities & Services";
  }
  if (lowerName.includes("sports")) {
    return "Sports & Recreation";
  }

  return "Other";
};
