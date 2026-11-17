import { Confirm as Alert } from "../components/confirm";
import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  View,
  ScrollView,
  Platform,
  Text,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue/400Regular";
import { Montserrat_400Regular } from "@expo-google-fonts/montserrat/400Regular";
import { Montserrat_600SemiBold } from "@expo-google-fonts/montserrat/600SemiBold";
import * as Apple from "expo-apple-authentication";
import { useStore } from "../data/store";
import * as api from "../data/service";
import { Button, colors, fonts, Label, styles } from "../components/ui";
export default function Layout() {
  const s = useStore(),
    [fontsLoaded, fontError] = useFonts({
      BebasNeue_400Regular,
      Montserrat_400Regular,
      Montserrat_600SemiBold,
    }),
    [busy, setBusy] = useState(false),
    [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    let disposed = false,
      stop: (() => void) | undefined;
    void api.start().then((fn) => {
      if (disposed) fn();
      else stop = fn;
    });
    if (Platform.OS === "ios")
      void Apple.isAvailableAsync().then(setAppleAvailable);
    return () => {
      disposed = true;
      stop?.();
    };
  }, []);
  const login = (provider: "google" | "apple" | "demo") => {
    setBusy(true);
    void api
      .login(provider)
      .catch(api.reportError)
      .finally(() => setBusy(false));
  };
  if ((!fontsLoaded && !fontError) || !s.ready)
    return (
      <View
        style={[
          styles.page,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  if (!s.user)
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.page}>
          <StatusBar style="dark" />
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 28,
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 20,
                backgroundColor: colors.orange,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 56,
                  color: "white",
                }}
              >
                PA
              </Text>
            </View>
            <Label style={styles.brand}>PERFORMANS ACADEMY</Label>
            <Text
              style={[styles.heading, { fontSize: 44, textAlign: "center" }]}
            >
              Ekip Görev Takibi
            </Text>
            <Label style={[styles.muted, { textAlign: "center" }]}>
              Ekibin aynı sayfada, görevlerin yolunda.
            </Label>
            {s.error && (
              <View style={styles.banner}>
                <Label>{s.error}</Label>
              </View>
            )}
            {!api.previewOnly && (
              <View style={{ width: "100%", maxWidth: 340, gap: 12 }}>
                <Button
                  title="Google ile giriş yap"
                  icon="logo-google"
                  onPress={() => login("google")}
                  disabled={busy}
                  kind="primary"
                />
                {appleAvailable && (
                  <Apple.AppleAuthenticationButton
                    buttonType={Apple.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={7}
                    style={{ height: 48, width: "100%" }}
                    onPress={() => {
                      if (!busy) login("apple");
                    }}
                  />
                )}
              </View>
            )}
            {api.previewOnly && (
              <View style={{ maxWidth: 360, gap: 14 }}>
                <View style={styles.banner}>
                  <Label style={{ lineHeight: 22 }}>
                    Bu önizleme örnek verilerle çalışır. Google/Apple girişi ve
                    canlı ekip verileri özel derlemede açılır.
                  </Label>
                </View>
                <Button
                  title="Örnek verilerle dene"
                  kind="primary"
                  disabled={busy}
                  onPress={() => login("demo")}
                />
              </View>
            )}
            <Label
              style={[
                styles.muted,
                { fontSize: 11, marginTop: 20, textAlign: "center" },
              ]}
            >
              Yalnız yetkilendirilmiş ekip üyeleri erişebilir.
            </Label>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  if (!s.accessReady)
    return (
      <View
        style={[
          styles.page,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color={colors.orange} />
        <Label style={{ marginTop: 15 }}>Ekip erişimin kontrol ediliyor…</Label>
      </View>
    );
  if (!s.allowed)
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            styles.page,
            { justifyContent: "center", padding: 28, gap: 18 },
          ]}
        >
          <Text style={styles.heading}>Ekip erişimi bekleniyor</Text>
          <Label style={{ lineHeight: 23 }}>
            {s.user.email || "Bu hesap"} henüz ekip listesinde görünmüyor. Ekip
            yöneticisinden bu adresi eklemesini iste.
          </Label>
          <Label style={styles.muted}>
            Apple ile e-postanı gizlediysen listede Apple’ın verdiği özel adres
            kullanılmalı.
          </Label>
          {s.error && (
            <View style={styles.banner}>
              <Label>{s.error}</Label>
            </View>
          )}
          <Button
            title="Hesabımı sil"
            kind="danger"
            onPress={() =>
              Alert.alert(
                "Hesabını sil?",
                "Giriş hesabın ve varsa ekip erişimin kalıcı olarak kaldırılacak.",
                [
                  { text: "Vazgeç", style: "cancel" },
                  {
                    text: "Hesabımı sil",
                    style: "destructive",
                    onPress: () => {
                      void api.deleteAccount().catch(api.reportError);
                    },
                  },
                ],
              )
            }
          />
          <Button
            title="Çıkış yap"
            onPress={() => {
              void api.logout().catch(api.reportError);
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.darkOrange,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 10 },
          tabBarStyle: {
            borderTopColor: colors.line,
            elevation: 0,
            shadowOpacity: 0,
          },
          sceneStyle: { backgroundColor: "white" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Görevler",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="checkbox-outline"
                color={typeof color === "string" ? color : colors.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="takvim"
          options={{
            title: "Takvim",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="calendar-outline"
                color={typeof color === "string" ? color : colors.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ekip"
          options={{
            title: "Ekip",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="people-outline"
                color={typeof color === "string" ? color : colors.muted}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ayarlar"
          options={{
            title: "Ayarlar",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="settings-outline"
                color={typeof color === "string" ? color : colors.muted}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
