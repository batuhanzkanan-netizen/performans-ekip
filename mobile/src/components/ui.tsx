import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
export const colors = {
  orange: "#F26B1D",
  darkOrange: "#C2510F",
  pale: "#FFF1E8",
  text: "#1F1F1E",
  muted: "#7A7975",
  line: "#EFEFED",
  red: "#D93025",
  hover: "#F7F7F5",
};
export const fonts = {
  body: "Montserrat_400Regular",
  bold: "Montserrat_600SemiBold",
  heading: "BebasNeue_400Regular",
};
export function Label({
  children,
  style,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: fonts.body, fontSize: 14, color: colors.text },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  kind = "plain",
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: "plain" | "primary" | "danger";
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        kind === "primary" && { backgroundColor: colors.orange },
        kind === "danger" && { backgroundColor: colors.red },
        pressed && { opacity: 0.65 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={19}
          color={kind === "plain" ? colors.darkOrange : "white"}
        />
      )}
      <Label
        style={{
          fontFamily: fonts.bold,
          color: kind === "plain" ? colors.darkOrange : "white",
        }}
      >
        {title}
      </Label>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  color = colors.muted,
  disabled = false,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={name} color={color} size={21} />
    </Pressable>
  );
}
export function Sheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="Pencereyi kapat"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.heading}>{title}</Text>
            <IconButton name="close" label="Kapat" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Choices({
  title,
  options,
  value,
  onChange,
  onClose,
}: {
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible title={title} onClose={onClose}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => {
            onChange(o.value);
            onClose();
          }}
          style={styles.choice}
        >
          <Label>{o.label}</Label>
          {o.value === value && (
            <Ionicons name="checkmark" color={colors.orange} size={22} />
          )}
        </Pressable>
      ))}
    </Sheet>
  );
}
export function NameDialog({
  title,
  initial = "",
  onSave,
  onClose,
  onDelete,
}: {
  title: string;
  initial?: string;
  onSave: (name: string) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = React.useState(initial);
  return (
    <Sheet visible title={title} onClose={onClose}>
      <TextInput
        accessibilityLabel="Eğitmen adı"
        autoFocus
        value={name}
        onChangeText={setName}
        maxLength={100}
        placeholder="Eğitmenin adı"
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (name.trim()) onSave(name.trim());
        }}
      />
      <View style={styles.actions}>
        {onDelete && (
          <Button title="Eğitmeni sil" kind="danger" onPress={onDelete} />
        )}
        <Button
          title="Kaydet"
          kind="primary"
          disabled={!name.trim()}
          onPress={() => onSave(name.trim())}
        />
      </View>
    </Sheet>
  );
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "white" },
  content: { paddingHorizontal: 20 },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2.4,
    color: colors.orange,
  },
  heading: { fontFamily: fonts.heading, fontSize: 32, color: colors.text },
  button: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  banner: {
    backgroundColor: colors.pale,
    padding: 14,
    borderRadius: 7,
    marginVertical: 8,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E1DE",
    borderRadius: 7,
    minHeight: 48,
    padding: 12,
    color: colors.text,
  },
  overlay: { flex: 1, backgroundColor: "#0005", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  choice: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.hover,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
