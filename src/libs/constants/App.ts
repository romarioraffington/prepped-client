import Constants from "expo-constants";
import * as Application from "expo-application";

export const APP_VERSION = Application.nativeApplicationVersion || "";
export const APP_BUILD_NUMBER = Application.nativeBuildVersion || "";
export const APP_STORE_ID = Constants.expoConfig?.extra?.APP_STORE_ID as
  | string
  | undefined;
