import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

const HIDDEN_TAB_SCREENS = [
  "profile",
  "cookbooks/[slug]",
  "(legal)/privacy-policy",
  "(legal)/terms-of-service",
  "(home)/cookbooks/[slug]/index",
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
