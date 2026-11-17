> **Mobil uygulama:** iOS/Android ve App Store hazırlığı `mobile/` klasöründedir. Expo Go, özel derleme ve TestFlight adımları için [mobil kurulum rehberini](mobile/README.md) aç.
> **Ekip erişimi:** `config/access` içinde `editors` ve `viewers` listeleri kullanılır. Yalnız bu listelerdeki doğrulanmış hesaplar okuyabilir; editörler düzenler.

# Performans Academy — Ekip Görev Takibi

Türkçe, mobil öncelikli Vite + vanilla JavaScript PWA. Firebase Google Authentication, canlı Firestore verileri ve çevrimdışı IndexedDB önbelleği kullanır.

## 1. Firebase projesini oluştur

1. https://console.firebase.google.com adresinden proje oluştur.
2. Proje ayarları → Uygulamalarınız → Web (`</>`) ile uygulama ekle. Firebase Hosting gerekmez.
3. Oluşan `firebaseConfig` değerlerini sakla.
4. Build → Authentication → Get started → Sign-in method → Google sağlayıcısını etkinleştir; destek e-postanı seç.
5. Build → Firestore Database → Create database → Standard / üretim modunu seç; uygun bölgeyle oluştur.

## 2. Yetkili alan adını ekle

Authentication → Settings → Authorized domains bölümüne `batuhanzkanan-netizen.github.io` ekle. Buraya `https://` veya `/performans-ekip/` yazma. Yerel geliştirme için `localhost` alanını ayrıca ekle.

## 3. Kuralları yayınla ve editörleri tanımla

1. Firestore → Rules bölümüne bu projedeki `firestore.rules` dosyasının tamamını yapıştırıp Publish'e bas.
2. Data → Start collection: `config`, Document ID: `access`.
3. `editors` adında **array** alanı oluştur. Her öğe **string** olmalı. Google hesabındaki e-posta adreslerini tam ve aynı büyük/küçük harfle ekle: ör. `isim@gmail.com`.
4. Bu belge uygulamadan değiştirilemez; editör listesini Firebase Console'dan yönet.
5. Yalnız `editors` veya `viewers` listesine eklenmiş, doğrulanmış e-posta sahipleri görevleri okuyabilir. `editors` listesi düzenler; `viewers` listesi yalnız görüntüler. Giriş yapılmadan veri sorgulanmaz.

CLI alternatifi: `npx firebase-tools login`, ardından `npx firebase-tools deploy --only firestore:rules --project PROJE_KIMLIGI`.

## 4. GitHub deposu ve Secrets

1. https://github.com/new adresinde `batuhanzkanan-netizen/performans-ekip` deposunu oluştur. Paketin dosyalarını **kök dizine**, `src/`, `public/` ve `.github/` klasörlerini koruyarak `main` dalına aktar. Yerel klasörü yüklerken `.github/workflows/deploy.yml` dosyasının da aktarıldığını kontrol et.
2. Settings → Secrets and variables → Actions → New repository secret ile aşağıdakileri ekle:

| Secret adı | firebaseConfig alanı |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Bunlar Firebase web istemcisi yapılandırmasıdır; derlenmiş JavaScript içinde görünür. Veri güvenliğini Firestore Rules sağlar. Servis hesabı veya özel anahtar ekleme. Gerçek `.env` dosyasını Git'e gönderme.

## 5. GitHub Pages'i aç

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Actions → GitHub Pages yayını → Run workflow → `main`. Sonraki her `main` push'unda otomatik yayınlanır.
3. Başarılı akıştan sonra adres: https://batuhanzkanan-netizen.github.io/performans-ekip/
4. Farklı depo adı kullanırsan `vite.config.js` içindeki `base`, manifest `id`, `start_url` ve `scope` değerlerini birlikte güncelle.

## 6. Telefonda ana ekrana ekle

- iPhone/iPad: Safari'de adresi aç → Paylaş → Ana Ekrana Ekle → Ekle.
- Android: Chrome'da aç → menü → Uygulamayı yükle / Ana ekrana ekle.
- İlk açılışta internetle giriş yapıp görevlerin eşitlenmesini bekle. Sonraki açılışlarda uygulama dosyaları ve önceki görevler çevrimdışı erişilebilir. İlk giriş internet gerektirir.
- Manifest `fullscreen` ister; iOS kendi platform kurallarıyla bağımsız uygulama görünümünü kullanır.

## Yerel geliştirme

Node.js 22 kullan:

```bash
npm ci
cp .env.example .env
# .env değerlerini doldur
npm run dev
npm test
npm run build
npm run preview
```

Firebase ayarları eksikse veri yerine kurulum mesajı gösterilir. Gerçek `.env` olmadan da üretim derlemesi tamamlanır; Actions eksik secret varsa anlaşılır hata vererek yayını durdurur.

## Kullanım ve davranışlar

- Üstteki + ile eğitmen ekle. Aktif eğitmenin kalem düğmesiyle adını değiştir veya görevleriyle sil.
- Eğitmen silme, internet ve sunucuyla eşitlenmiş veri gerektirir. Önce eğitmen belgesine geçici `deleting: true` kilidi konur; kurallar bu eğitmene yeni görev/aktarım yapılmasını engeller. Sunucudan tüm görevler okunup 400'lük gruplarla silinir, ardından eğitmen kaldırılır. Kesinti olursa kalem → Eğitmeni sil ile işlemi tamamla. Kısmen silinmiş görevler geri alınmaz.
- Başlık ve not 1,2 saniye sonra veya odak ayrılınca kaydedilir. Başlıkta Enter kaydeder. Esc henüz gönderilmemiş düzenlemeyi geri alır. Zaten sunucuya gönderilmiş değişikliği geri almak için alanı yeniden düzenle.
- Canlı güncelleme, odaktaki form alanı kapanana kadar ertelenir. Düzenleme yetkisi kaldırılırsa güvenlik için düzenleme hemen kapanır.
- Aynı alanı eşzamanlı değiştirenlerde Firestore'un son yazma davranışı geçerlidir. Farklı alanlar ayrı güncellenir.
- Çevrimdışı değişiklikler bağlantı gelince kurallara tekrar tabi tutulur. Yetki kaldırıldıysa reddedilir ve uyarı gösterilir.
- Çıkışta ekrandaki veriler temizlenir. Firestore önbelleği cihazda kalır; ortak kullanılan cihazlarda tarayıcı site verilerini temizle. Kalıcı önbellek kişisel, güvenilir cihazlar içindir.
- Notlardaki ilk HTTP/HTTPS bağlantısının yanında ↗ açılır. Diğer protokoller çalıştırılmaz.
- Tamamlananlar her sıralamada alttadır. Gecikmiş tarihi yerel cihaz gününe göre hesaplanır.
- Takvim, Ekip ve Ayarlar düğmeleri şimdilik Yakında bildirimi gösterir.
- PWA güncellemesi hazır olduğunda bildirim çıkar; kaydetme sürerken veya alan düzenlenirken zorla yenilemez.

## Doğrulama sınırları

`npm test` sıralama, filtre, gecikme, güvenli metin ve bağlantı işlemlerini doğrular. `npm run build` servis çalışanını ve `manifest.json` dosyasını üretir. Gerçek Google giriş, iki cihazda canlı eşitleme, Firebase yetki kuralları ve çevrimdışı yeniden açılış için Firebase kurulumu gerekir.

Güncel Lighthouse sürümlerinde ayrı PWA puan kategorisi kaldırılmıştır. Yayın sonrası Chrome DevTools → Application üzerinden manifest, ikonlar, scope ve servis çalışanını; Network → Offline üzerinden önbellekten açılışı kontrol et. Lighthouse üzerinden erişilebilirlik, performans ve iyi uygulamalar denetlenebilir. Gerçek alan ve Firebase olmadan Lighthouse/PWA başarısı doğrulanmış kabul edilmez.

## Kaynaklar

- [Firebase çevrimdışı veri ve kalıcı önbellek](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Vite PWA güncelleme bildirimi](https://vite-pwa-org.netlify.app/guide/prompt-for-update)
- [Lighthouse 12: PWA kategorisinin kaldırılması](https://github.com/GoogleChrome/lighthouse/releases/tag/v12.0.0)

Teslim kontrolü: 6 otomatik test geçti; üretim derlemesi başarıyla tamamlandı. Masaüstü ve 390 px mobil arayüz örnek verilerle incelendi. Firebase emülatör kuralları ve gerçek hesaplarla uçtan uca akış bu ortamda çalıştırılmadı. GitHub Actions yayını için altı Firebase secret değeri ve Pages kaynağı ayarı gereklidir.
