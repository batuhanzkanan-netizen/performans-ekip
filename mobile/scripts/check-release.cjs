const fs = require("node:fs");
const keys = [
  "EXPO_PUBLIC_EAS_PROJECT_ID",
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
];
if (process.env.EAS_BUILD_PROFILE === "production")
  keys.push("EXPO_PUBLIC_PRIVACY_URL", "EXPO_PUBLIC_SUPPORT_EMAIL");
const missing = keys.filter((k) => !process.env[k]);
const platform = process.env.EAS_BUILD_PLATFORM;
for (const [p, key, fallback] of [
  ["ios", "GOOGLE_SERVICES_PLIST", "./GoogleService-Info.plist"],
  ["android", "GOOGLE_SERVICES_JSON", "./google-services.json"],
])
  if (!platform || platform === p) {
    if (!fs.existsSync(process.env[key] || fallback))
      missing.push(key + " (dosya)");
  }
if (missing.length) {
  console.error("Mobil derleme ayarları eksik: " + missing.join(", "));
  process.exit(1);
}
if (
  process.env.EAS_BUILD_PROFILE === "production" &&
  !/^https:\/\//.test(process.env.EXPO_PUBLIC_PRIVACY_URL || "")
) {
  console.error("Gizlilik politikası HTTPS adresinde yayınlanmalı.");
  process.exit(1);
}
console.log("Mobil derleme ayarları doğrulandı.");
