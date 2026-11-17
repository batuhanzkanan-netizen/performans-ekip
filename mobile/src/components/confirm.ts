import { Alert as NativeAlert, Platform } from "react-native";
import type { AlertButton } from "react-native";
export const Confirm = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS === "web") {
      const accepted = globalThis.confirm(
        [title, message].filter(Boolean).join("\n\n"),
      );
      const button = accepted
        ? buttons?.find((b) => b.style !== "cancel")
        : buttons?.find((b) => b.style === "cancel");
      button?.onPress?.();
    } else NativeAlert.alert(title, message, buttons);
  },
};
