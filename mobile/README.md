# Performans Academy Ekip — iOS ve Android

Expo projesi: https://expo.dev/accounts/batuhanzkanans-team/projects/performans-academy-ekip

Proje kimliği ve sahibi `app.config.ts` içinde bağlıdır. `eas init` ile yeni proje oluşturma; mevcut proje kullanılır.

Bu klasör Expo SDK 58, React Native ve TypeScript ile hazırlanan mobil uygulamadır. Web PWA deposunun kökünde korunur. Aynı Firestore görevlerini kullanırlar.

## Expo Go ile arayüz önizleme

```bash
cd mobile
npm ci
npm start
```

Expo Go'dan terminaldeki QR kodunu aç ve **Örnek verilerle dene** düğmesine bas. Bu mod örnek görevleri yalnız bu cihazda saklar. Google/Apple girişi veya gerçek ekip verilerini kullanmaz. Örnek verileri Ayarlar'dan temizleyebilirsin. Başka telefona senkronize olmaz. Expo Go sürümün SDK 58'i desteklemeli.

Gerçek uygulama React Native Firebase ve Google Sign-In modülleri içerdiği için **development build** gerekir. Expo Go yerine ekibe TestFlight sürümü dağıtılır. Paketleme sırasında `APP_VARIANT=native` kullanılır; üretim sürümünde örnek veri giriş düğmesi yoktur.

## Ekip erişimi

Firestore `config/access` belgesini şu alanlarla oluştur:

```json
{
  "editors": ["yonetici@example.com"],
  "viewers": ["egitmen@example.com"]
}
```

Adresler Google/Apple hesabında görünen haliyle birebir eşleşmeli; e-posta doğrulanmış olmalı. Editörler okuyup yazar, izleyiciler yalnız okur. Ekip dışındaki hesaplar görevleri ve erişim listesini okuyamaz. Firebase Console yöneticisi bu listeleri değiştirir. Apple'ın E-postamı Gizle özelliğinde uygulama erişim ekranında görünen özel adres listeye eklenir. Hesaplar arası veri birleştirme otomatik yapılmaz; aynı e-posta başka sağlayıcıda kayıtlıysa o yöntemle giriş yapılır.

Depo kökündeki `firestore.rules` dosyasını Firebase'e yayınla. Bu kural hem PWA'yı hem mobil uygulamayı korur.

## Firebase mobil kurulumu

1. Firebase Console'da Google Authentication, Apple Authentication ve Firestore'u etkinleştir.
2. **Kesin iOS bundle identifier ve Android package** adını belirle. Varsayılan `com.performansacademy.ekip` başlangıç değeridir; mağaza kaydı yapılmadan önce kuruma ait benzersiz kimlik olarak doğrulanmalı.
3. Firebase'e aynı kimliklerle iOS ve Android uygulamalarını ekle.
4. iOS için `GoogleService-Info.plist`, Android için `google-services.json` indir. Bu dosyaları commit etme; Expo environment variables bölümüne file türünde yükle. Yerelde `mobile/` içine koyabilirsin.
5. iOS Google OAuth istemcisini ve Google **Web OAuth istemci kimliğini** Firebase/Google Cloud Console'dan al. Android Google girişinde kullanılan derleme sertifikalarının SHA-1/SHA-256 değerlerini Firebase'e ekle.
6. Apple Developer hesabında App ID için **Sign in with Apple** capability'sini aç, Firebase Apple sağlayıcısı yapılandırmasını tamamla.
7. `.env.example` değerlerini Expo'nun development, preview ve production ortamlarına ekle. `EXPO_PUBLIC_*` değerler derlenmiş uygulamada görünür; özel anahtar veya servis hesabı kullanma.

Uygulama Firebase native SDK'nın varsayılan kalıcı Firestore önbelleğini kullanır. Bekleyen değişiklikler bağlantı gelince sunucuda yeniden yetki denetiminden geçer. Çıkışta ekrandaki veriler temizlenir; cihaz önbelleği kalabilir. Ortak cihazlarda uygulama verilerini temizle.

## Hesap silme sunucusu

Uygulama içindeki **Ayarlar → Hesabımı sil**, son 5 dakika içinde doğrulanmış oturumla `deleteMyAccount` callable işlevini çağırır. Google/Apple kimliği yeniden doğrulanır; Apple kullanıcısının yetkisi silmeden önce iptal edilir. İşlev yalnız çağıran UID'yi siler, istemciden UID/e-posta kabul etmez. Kullanıcının e-postasını `editors` ve `viewers` listelerinden kaldırır; Firebase Authentication hesabını siler. Ortak görevler ve eğitmen kayıtları kullanıcı UID'sine bağlı olmadığından ekipte kalır.

Depo kökünde:

```bash
npm ci --prefix functions
npx firebase-tools login
npx firebase-tools deploy --only functions,firestore:rules --project FIREBASE_PROJE_KIMLIGI
```

Cloud Functions yayını için uygun Firebase faturalandırma planı gerekir. İşlev bölgesi `europe-west1`; değiştirirsen `functions/index.js` ve `EXPO_PUBLIC_FUNCTIONS_REGION` birlikte değişmeli. Hesap silme sunucusunu yayınlamadan App Store'a gönderme. Silinen hesabın yeniden ekip erişimi alması için yönetici e-postayı tekrar eklemeli.

## Development build ve TestFlight

```bash
cd mobile
npx eas-cli@latest login
# Proje kimliği app.config.ts içinde bağlıdır.
# Kendi Expo hesabın bu takım projesine erişebilmelidir.
npx eas-cli@latest build --platform ios --profile development
npm run dev-client
```

Fiziksel iOS cihazına internal development dağıtımı için Apple cihaz kaydı gerekir. Ekibe TestFlight dağıtımı için:

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

Apple Developer üyeliği, App Store Connect uygulama kaydı ve derleme imzalama yetkileri gerekir. `eas.json` kimlikler veya Apple şifresi içermez. EAS bunları hesap sahibinin oturumunda yönetir. Build ve submit ücretleri/planları hesap koşullarına bağlıdır. TestFlight yüklemesi ve App Store incelemesine gönderim ayrı adımlardır.

## App Store'a gönderilmeden önce

- Kesin uygulama adı, bundle identifier, Expo proje/owner bağlantısı, destek e-postası ve HTTPS gizlilik politikası URL'sini belirle.
- `EXPO_PUBLIC_PRIVACY_URL` ve `EXPO_PUBLIC_SUPPORT_EMAIL` production ortamında zorunludur. `docs/privacy-policy-draft.md` kurumun onaylayıp tamamlayacağı taslaktır.
- App Store Connect'te App Privacy yanıtlarını gerçek Firebase/Google/Apple kullanımıyla uyumlu doldur. Uygulamaya reklam veya izleme SDK'sı eklenmedi.
- Ekran görüntüleri ve açıklamalar gerçek cihaz sürümünden hazırlanmalı. İnceleme ekibine çalışan erişim yöntemi ve gerekli test üyeliği sağlanmalı.
- Google ve Apple girişini, ekip dışı erişim reddini, editör/izleyici ayrımını, çevrimdışı yeniden açılışı ve hesap silmeyi TestFlight'ta gerçek hesaplarla doğrula.
- Şimdilik Takvim/Ekip sekmeleri Yakında gösterir. Mağaza sunumu öncesinde bu yer tutucuların tutulup tutulmayacağı ürün kararıdır.

## Kontroller

```bash
npm run typecheck
npm run lint
npm test
npm run export:preview
npx expo export --platform ios --output-dir dist/ios
npx expo export --platform android --output-dir dist/android
npx expo-doctor
```

JavaScript export ve tip kontrolü, Xcode/Gradle native derlemesinin veya gerçek cihaz testinin yerini tutmaz. Bu teslimde gerçek Firebase/Expo/Apple hesap dosyaları olmadan imzalı IPA, TestFlight yayını ve App Store onayı üretilmez. `npm run check:release` eksik yapılandırmayı bildirir; production derlemesindeki post-install kontrolü eksik ayarlarla devam etmez.

RNFirebase 26.4.2 sabitlenmiştir; iOS bağımlılıkları CocoaPods + static frameworks kullanır. RNFirebase 27 SPM geçişi ayrı bir native derleme doğrulaması gerektirir. SDK yükseltirken sürümleri rastgele değiştirmek yerine `expo install --check` ve gerçek iOS/Android derlemesi kullan.

## Kaynaklar

- https://docs.expo.dev/guides/using-firebase/
- https://docs.expo.dev/guides/google-authentication/
- https://docs.expo.dev/versions/v58.0.0/sdk/apple-authentication/
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/

## Bu teslimde doğrulananlar

Mobil TypeScript kontrolü, lint ve 3 model testi geçti. iOS/Android JavaScript paketleri ile web önizleme export'u üretildi. Tarayıcı önizlemesinde örnek eğitmen ekleme, görev ekleme ve tamamlama çalıştırıldı. Firestore emülatöründe 5 erişim/şema testi ve depoda 8 birim testi geçti. Gerçek native derleme, Google/Apple girişi, TestFlight ve App Store yayını hesap yapılandırması tamamlanana kadar doğrulanmadı.
