#!/usr/bin/env node
/**
 * Kurucu (super_admin) için Firebase Auth custom claim ayarlar.
 * Storage rules (legal_archive) ve API yetkisi için gerekli.
 *
 * Kullanım: npm run set-super-admin -- <UID>
 * Örnek:    node scripts/set-super-admin-claim.js sxT56ThMSZekWnOo48OJJKQufCb2
 *
 * NOT: Kullanıcı çıkış yapıp tekrar giriş yapmalı (veya token yenilenmeli).
 */

try { require("dotenv").config({ path: ".env.local" }); } catch (_) {}

const admin = require("firebase-admin");

const uid = process.argv[2];
if (!uid) {
  console.error("Kullanım: node scripts/set-super-admin-claim.js <UID>");
  process.exit(1);
}

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY tanımlı değil. .env.local yükleyin.");
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(key)) });
}

admin.auth().setCustomUserClaims(uid, { role: "super_admin" })
  .then(() => {
    console.log(`✓ ${uid} için role: 'super_admin' claim ayarlandı.`);
    console.log("  Kullanıcının çıkış yapıp tekrar giriş yapması gerekebilir.");
  })
  .catch((err) => {
    console.error("Hata:", err.message);
    process.exit(1);
  });
