#!/usr/bin/env node
/**
 * Firebase Auth sağlayıcılarını API ile otomatik etkinleştirme
 * FIREBASE_SERVICE_ACCOUNT_KEY gerekli
 *
 * Kullanım: npm run enable-auth
 */

const { execSync } = require("child_process");

try {
  require("dotenv").config({ path: ".env.local" });
} catch (_) {}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "benim-ai-projem-2";
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

async function run() {
  console.log("\n🔐 Firebase Auth - Otomatik Etkinleştirme\n");

  if (!serviceAccountKey) {
    console.log("⚠️  FIREBASE_SERVICE_ACCOUNT_KEY .env.local'de tanımlı değil.\n");
    console.log("   Otomatik etkinleştirme için:");
    console.log("   1. Firebase Console → Proje ayarları → Hizmet hesapları");
    console.log("   2. 'Yeni özel anahtar oluştur' → JSON indir");
    console.log("   3. JSON içeriğini .env.local'e FIREBASE_SERVICE_ACCOUNT_KEY= olarak ekle\n");
    console.log("   Detaylı rehber: FIREBASE-AUTH-KURULUM.md dosyasına bakın.\n");
    openBrowser();
    return;
  }

  try {
    const admin = require("firebase-admin");
    const key = JSON.parse(serviceAccountKey);

    if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(key) });
    }

    const credential = admin.credential.cert(key);
    const tokenRes = await credential.getAccessToken();
    const accessToken = tokenRes.access_token;

    const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}`;

    // 1. Email/Password etkinleştir
    console.log("1. E-posta/Şifre etkinleştiriliyor...");
    try {
      const getRes = await fetch(`${base}/config`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!getRes.ok) throw new Error(getRes.status + " " + (await getRes.text()));

      const config = await getRes.json();
      const signIn = config.signIn || {};
      const email = signIn.email || { enabled: false, passwordRequired: true };

      if (!email.enabled) {
        const patchRes = await fetch(`${base}/config?updateMask=signIn.email`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...config,
            signIn: {
              ...signIn,
              email: { enabled: true, passwordRequired: true },
            },
          }),
        });
        if (patchRes.ok) {
          console.log("   ✓ E-posta/Şifre etkinleştirildi\n");
        } else {
          console.log("   ✗", patchRes.status, await patchRes.text(), "\n");
        }
      } else {
        console.log("   ✓ Zaten etkin\n");
      }
    } catch (e) {
      console.log("   ✗", e.message, "\n");
    }

    // 2. Google etkinleştir (varsayılan config ile)
    console.log("2. Google (Gmail) etkinleştiriliyor...");
    try {
      const listRes = await fetch(`${base}/defaultSupportedIdpConfigs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (listRes.ok) {
        const data = await listRes.json();
        const configs = data.idpConfigs || data.defaultSupportedIdpConfigs || [];
        const google = configs.find((c) => c.name?.includes("google.com"));

        if (google && !google.enabled) {
          const patchRes = await fetch(`${base}/defaultSupportedIdpConfigs/google.com?updateMask=enabled`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...google, enabled: true }),
          });
          if (patchRes.ok) console.log("   ✓ Google etkinleştirildi\n");
          else console.log("   ✗", patchRes.status, "\n");
        } else if (google?.enabled) {
          console.log("   ✓ Zaten etkin\n");
        } else {
          console.log("   ⚠ Google config yok - Console'dan etkinleştirin\n");
        }
      } else {
        console.log("   ⚠ API erişilemedi. Console kullanın.\n");
      }
    } catch (e) {
      console.log("   ✗", e.message, "\n");
    }

    // 3. Authorized domains kontrol
    console.log("3. Authorized domains kontrol ediliyor...");
    try {
      const configRes = await fetch(`${base}/config`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (configRes.ok) {
        const cfg = await configRes.json();
        const domains = cfg.authorizedDomains || [];
        const needs = ["localhost", "127.0.0.1"];
        const missing = needs.filter((d) => !domains.includes(d));
        if (missing.length > 0) {
          console.log("   ⚠ Eklenmesi gereken:", missing.join(", "));
          console.log("   → Console: Settings → Authorized domains\n");
        } else {
          console.log("   ✓ localhost ve 127.0.0.1 mevcut\n");
        }
      }
    } catch (e) {
      console.log("   ✗", e.message, "\n");
    }

    console.log("✅ İşlem tamamlandı. Giriş yöntemlerini test edin.\n");
  } catch (e) {
    console.log("❌ Hata:", e.message);
    console.log("\nFirebase Console üzerinden manuel etkinleştirin:\n");
    openBrowser();
  }
}

function openUrl(url) {
  try {
    const cmd =
      process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    execSync(cmd, { stdio: "ignore" });
  } catch (_) {}
}

function openBrowser() {
  const providersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
  console.log("   " + providersUrl + "\n");
  openUrl(providersUrl);
}

run().catch(console.error);
