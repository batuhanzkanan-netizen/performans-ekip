import { Confirm as Alert } from "../components/confirm";
import { Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useStore, setState } from "../data/store";
import * as api from "../data/service";
import { Button, colors, Label, Sheet, styles } from "../components/ui";
export default function Settings() {
  const s = useStore(),
    [privacy, setPrivacy] = useState(false),
    [busy, setBusy] = useState(false);
  const deleteAccount = () =>
    Alert.alert(
      s.demo ? "Örnek verileri sil?" : "Hesabını sil?",
      s.demo
        ? "Bu cihazdaki örnek kayıtlar temizlenecek."
        : "Giriş hesabın ve ekip erişim listesindeki e-posta kaydın kalıcı olarak silinecek. Ortak ekip görevleri korunur. Devam etmek için girişini tekrar doğrulayacaksın.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabımı sil",
          style: "destructive",
          onPress: () => {
            setBusy(true);
            void api
              .deleteAccount()
              .catch(api.reportError)
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <Text style={styles.heading}>Ayarlar</Text>
        <View>
          <Label>{s.user?.name || "Ekip üyesi"}</Label>
          <Label style={styles.muted}>{s.user?.email}</Label>
          <Label style={[styles.muted, { marginTop: 8 }]}>
            {s.demo
              ? "Örnek veri modu"
              : s.editor
                ? "Düzenleme yetkin var"
                : "Yalnız görüntüleme"}
          </Label>
        </View>
        {!!s.error && (
          <View style={styles.banner}>
            <Label>{s.error}</Label>
            <Button title="Kapat" onPress={() => setState({ error: "" })} />
          </View>
        )}
        <Button
          title="Gizlilik ve veriler"
          icon="shield-checkmark-outline"
          onPress={() => setPrivacy(true)}
        />
        {process.env.EXPO_PUBLIC_SUPPORT_EMAIL && (
          <Button
            title="Destek"
            icon="mail-outline"
            onPress={() => {
              void Linking.openURL(
                `mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL}`,
              ).catch(api.reportError);
            }}
          />
        )}
        <Button
          title="Çıkış yap"
          icon="log-out-outline"
          disabled={busy}
          onPress={() => {
            void api.logout().catch(api.reportError);
          }}
        />
        <View
          style={{
            borderTopWidth: 1,
            borderColor: colors.line,
            paddingTop: 20,
            gap: 12,
          }}
        >
          <Label style={styles.muted}>
            Hesabını silebilir ve ekip erişim kaydını kaldırabilirsin. Ortak
            çalışma kayıtları ekibine ait olduğu için korunur.
          </Label>
          <Button
            title={s.demo ? "Örnek verileri temizle" : "Hesabımı sil"}
            kind="danger"
            disabled={busy}
            onPress={deleteAccount}
          />
        </View>
        <Label style={[styles.muted, { fontSize: 10 }]}>
          Performans Academy Ekip · 1.0.0
        </Label>
      </ScrollView>
      <Sheet
        visible={privacy}
        title="Gizlilik ve veriler"
        onClose={() => setPrivacy(false)}
      >
        <Label style={{ lineHeight: 24 }}>
          Hesap adı, e-posta ve giriş kimliği erişim yönetimi için kullanılır.
          Görevler ve eğitmen kayıtları yalnız yetkili ekip üyeleriyle
          paylaşılır.{"\n\n"}Görevler cihazda çevrimdışı kullanım için saklanır.
          Ortak cihazlarda oturumu kapattıktan sonra uygulama verilerini
          temizleyin. Uygulamaya sağlık bilgileri gibi hassas kişisel bilgiler
          girmeyin.{"\n\n"}Hesap silme giriş hesabını ve erişim listesindeki
          kaydını kaldırır. Ortak ekip görevleri saklanır. Apple ile giriş
          kullanıyorsan Apple erişimi de iptal edilir.
        </Label>
        {process.env.EXPO_PUBLIC_PRIVACY_URL ? (
          <Button
            title="Tam gizlilik politikasını aç"
            onPress={() => {
              void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL!).catch(
                api.reportError,
              );
            }}
          />
        ) : (
          <View style={styles.banner}>
            <Label style={styles.muted}>
              Yayın öncesinde kurumun gizlilik politikası bağlantısı eklenecek.
            </Label>
          </View>
        )}
      </Sheet>
    </SafeAreaView>
  );
}
