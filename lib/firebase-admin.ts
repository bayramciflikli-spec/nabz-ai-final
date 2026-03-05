import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

let _adminStorage: ReturnType<typeof getStorage> | null = null;

function getAdminStorage() {
  if (_adminStorage) return _adminStorage;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY tanımlı değil. Firebase Console > Proje Ayarları > Hizmet Hesapları > Yeni Özel Anahtar Oluştur"
    );
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  _adminStorage = getStorage();
  return _adminStorage;
}

export function getAdminStorageInstance() {
  return getAdminStorage();
}

let _adminDb: ReturnType<typeof getFirestore> | null = null;

export function getAdminFirestore() {
  if (_adminDb) return _adminDb;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) return null;
  try {
    if (getApps().length === 0) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    _adminDb = getFirestore();
    return _adminDb;
  } catch {
    return null;
  }
}
