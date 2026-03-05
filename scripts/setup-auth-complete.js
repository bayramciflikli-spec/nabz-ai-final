#!/usr/bin/env node
/**
 * Firebase Auth kurulum - Tüm adımları sırayla tamamlar
 * 1. .env.local kontrol
 * 2. gerekli URL'leri tarayıcıda açar
 * 3. enable-auth çalıştırır
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  require("dotenv").config({ path: ".env.local" });
} catch (_) {}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "benim-ai-projem-2";
const rootDir = path.resolve(__dirname, "..");

function openUrl(url) {
  try {
    const cmd =
      process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function openAfter(ms, url) {
  return new Promise((r) => setTimeout(() => { openUrl(url); r(); }, ms));
}

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("  Firebase Auth - Kurulum Adımları");
  console.log("=".repeat(50) + "\n");

  const envPath = path.join(rootDir, ".env.local");
  const examplePath = path.join(rootDir, ".env.local.example");

  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    console.log("ADIM 1: .env.local oluşturuluyor (.env.local.example'dan)...\n");
    fs.copyFileSync(examplePath, envPath);
    console.log("   ✓ .env.local oluşturuldu. Değerleri doldurun.\n");
  } else if (fs.existsSync(envPath)) {
    console.log("ADIM 1: .env.local mevcut ✓\n");
  }

  const urls = {
    serviceAccount: `https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`,
    authProviders: `https://console.firebase.google.com/project/${projectId}/authentication/providers`,
    authSettings: `https://console.firebase.google.com/project/${projectId}/authentication/settings`,
  };

  console.log("ADIM 2: Tarayıcıda Firebase sayfaları açılıyor...\n");
  openUrl(urls.serviceAccount);
  await openAfter(1200, urls.authProviders);
  await openAfter(800, urls.authSettings);

  console.log("   ✓ Hizmet hesapları (Service Account)");
  console.log("   ✓ Sign-in method (Giriş sağlayıcıları)");
  console.log("   ✓ Ayarlar (Authorized domains)\n");

  console.log("ADIM 3: Service Account anahtarı alın:");
  console.log("   → İlk sekmede 'Yeni özel anahtar oluştur'");
  console.log("   → JSON indir, içeriği .env.local'e FIREBASE_SERVICE_ACCOUNT_KEY= olarak yapıştır\n");

  console.log("ADIM 4: Giriş sağlayıcılarını etkinleştirin:");
  console.log("   → İkinci sekmede: Email/Password → Enable → Save");
  console.log("   → Google → Enable → Save\n");

  console.log("ADIM 5: enable-auth script'i çalıştırılıyor...\n");
  try {
    require("dotenv").config({ path: path.join(rootDir, ".env.local") });
    execSync("node scripts/enable-auth-providers.js", {
      cwd: rootDir,
      stdio: "inherit",
    });
  } catch (e) {
    console.log("(Service account yoksa manuel etkinleştirin)\n");
  }

  console.log("\n" + "=".repeat(50));
  console.log("  Kurulum tamamlandı.");
  console.log("  Giriş yöntemlerini uygulamada test edin.");
  console.log("=".repeat(50) + "\n");
}

main().catch(console.error);
