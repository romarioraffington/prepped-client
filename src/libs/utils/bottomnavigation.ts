import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

const HIDDEN_TAB_SCREENS = [
  "profile",
  "imports/[slug]",
  "wishlists/[slug]/index",
  "imports/[slug]/index",
  "(legal)/privacy-policy",
  "(legal)/terms-of-service",
  "collections/[slug]/index",
  "wishlists/[slug]/options",
  "recommendations/[slug]/index",
  "recommendations/[slug]/photos",
  "wishlists/[slug]/edit-wishlist",
  "imports/[slug]/recommendations",
  "wishlists/[slug]/recommendations",
  "recommendations/[slug]/amenities",
  "collections/[slug]/recommendations",
];

export const getBottomNavigationVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "";

  // For nested stacks (like wishlists), construct the full path: tabName/nestedRouteName
  // If routeName is empty, we're on the tab's index screen
  // If routeName exists, we're on a nested screen within the tab's stack
  const fullRouteName = routeName ? `${route.name}/${routeName}` : route.name;
  return (
    HIDDEN_TAB_SCREENS.includes(fullRouteName) ||
    HIDDEN_TAB_SCREENS.includes(routeName)
  );
};
