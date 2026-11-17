import Constants from "expo-constants";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { clearSession, getState, setState } from "./store";
import type { Task } from "../domain/model";
export const previewOnly =
  Constants.executionEnvironment === "storeClient" || Platform.OS === "web";
let native: typeof import("./native") | null = null;
export function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code || "";
  if (code.includes("CANCEL") || code.includes("cancelled")) return "";
  if (code.includes("permission-denied"))
    return "Bu işlem için yetkin yok. Ekip yöneticisine ulaş.";
  if (code.includes("resource-exhausted"))
    return "Veri kotası doldu. Ekip yöneticisine haber ver.";
  if (code.includes("unavailable") || code.includes("network"))
    return "Bağlantını kontrol et. Değişiklikler internet gelince eşitlenir.";
  if (code.includes("account-exists-with-different-credential"))
    return "Bu e-posta başka bir giriş yöntemiyle kayıtlı. Önce o yöntemle giriş yap.";
  if (
    code.includes("requires-recent-login") ||
    code.includes("failed-precondition")
  )
    return "Hesabını silmek için yeniden giriş yapıp tekrar dene.";
  if (code.includes("user-mismatch"))
    return "Bu hesaba ait giriş yöntemini ve e-posta adresini kullan.";
  if (code.includes("too-many-requests"))
    return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  if (code.includes("invalid-credential"))
    return "Giriş doğrulanamadı. Yeniden giriş yap.";
  if (code.includes("functions/not-found"))
    return "Hesap silme hizmeti kurulmamış. Ekip yöneticisine ulaş.";
  if (code)
    return "İşlem tamamlanamadı. Yeniden dene; sürerse ekip yöneticisine ulaş.";
  return error instanceof Error
    ? error.message
    : "İşlem tamamlanamadı. Yeniden dene.";
}
export function reportError(error: unknown) {
  const text = errorMessage(error);
  if (text) setState({ error: text });
}
export async function start() {
  const off = NetInfo.addEventListener((s) =>
    setState({
      online: s.isConnected !== false && s.isInternetReachable !== false,
    }),
  );
  if (previewOnly) {
    if (
      Platform.OS === "web" &&
      process.env.EXPO_PUBLIC_DEMO_AUTOSTART === "true"
    ) {
      await (await import("./demo")).login();
      try {
        await (await import("./task-link")).loadTaskLink();
      } catch (error) {
        reportError(error);
      }
    } else setState({ ready: true });
    return off;
  }
  try {
    native = await import("./native");
    const unsubscribe = native.start();
    return () => {
      off();
      unsubscribe();
    };
  } catch {
    setState({
      ready: true,
      error:
        "Firebase mobil dosyaları eksik. Kurulum tamamlandıktan sonra uygulamayı yeniden derleyin.",
    });
    return off;
  }
}
async function backend() {
  if (getState().demo) return import("./demo");
  if (!native)
    throw new Error(
      "Gerçek ekip bağlantısı için özel uygulama derlemesi gerekiyor.",
    );
  return native;
}
export async function login(provider: "google" | "apple" | "demo") {
  if (provider === "demo") {
    if (!previewOnly) throw new Error("Örnek veri modu bu sürümde kapalı.");
    return (await import("./demo")).login();
  }
  if (!native)
    throw new Error(
      "Google ve Apple girişi özel uygulama derlemesinde açılacak.",
    );
  return native.login(provider);
}
export async function logout() {
  const b = await backend();
  await b.logout();
  clearSession();
}
const edit = () => {
  if (!getState().editor || !getState().allowed)
    throw new Error("Bu işlem için düzenleme yetkisi gerekiyor.");
};
export async function addTrainer(name: string) {
  edit();
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Eğitmen adı 1–100 karakter olmalı.");
  return (await backend()).addTrainer(name.trim());
}
export async function renameTrainer(id: string, name: string) {
  edit();
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Geçerli bir eğitmen adı yaz.");
  return (await backend()).renameTrainer(id, name.trim());
}
export async function removeTrainer(id: string) {
  edit();
  if (!getState().demo && (!getState().online || getState().cached))
    throw new Error(
      "Eğitmeni silmek için internet bağlantısını ve eşitlemeyi bekle.",
    );
  return (await backend()).removeTrainer(id);
}
export async function addTask(title: string, trainerId: string) {
  edit();
  if (!title.trim() || title.trim().length >= 200)
    throw new Error("Görev başlığı 1–199 karakter olmalı.");
  if (!getState().trainers.some((t) => t.id === trainerId && !t.deleting))
    throw new Error("Görev için aktif bir eğitmen seç.");
  return (await backend()).addTask(title.trim(), trainerId);
}
export async function patchTask(id: string, patch: Partial<Task>) {
  edit();
  return (await backend()).patchTask(id, patch);
}
export async function removeTask(id: string) {
  edit();
  return (await backend()).removeTask(id);
}
export async function deleteAccount() {
  if (!getState().demo && !getState().online)
    throw new Error("Hesabını silmek için internete bağlan.");
  return (await backend()).deleteAccount();
}
