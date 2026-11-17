import type { ExpoConfig, ConfigContext } from "expo/config";
const native = process.env.APP_VARIANT === "native";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Performans Academy Ekip",
  slug: "performans-academy-ekip",
  owner: "batuhanzkanans-team",
  version: "1.0.0",
  scheme: "paekip",
  orientation: "default",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier:
      process.env.IOS_BUNDLE_IDENTIFIER || "com.performansacademy.ekip",
    usesAppleSignIn: native,
    googleServicesFile: native
      ? process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist"
      : undefined,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: process.env.ANDROID_PACKAGE || "com.performansacademy.ekip",
    googleServicesFile: native
      ? process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
      : undefined,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#F26B1D",
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        backgroundColor: "#FFFFFF",
      },
    ],
    ...(native
      ? ([
          ["@react-native-firebase/app", { ios: { disableSPM: true } }],
          "@react-native-firebase/auth",
          [
            "@react-native-google-signin/google-signin",
            { iosDependencyManager: "cocoapods" },
          ],
          "expo-apple-authentication",
          [
            "expo-build-properties",
            {
              ios: {
                useFrameworks: "static",
                buildReactNativeFromSource: true,
              },
            },
          ],
        ] as NonNullable<ExpoConfig["plugins"]>)
      : []),
  ],
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "f6a47235-ec3b-4518-8593-7828a70270b1" },
    nativeConfigured: native,
  },
  web: { bundler: "metro", output: "single", favicon: "./assets/favicon.png" },
});
