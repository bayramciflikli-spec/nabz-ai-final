import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  connectAuthEmulator,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getEcosystemOwnerUid, ECOSYSTEM_OWNER_FIELD } from "./ecosystem";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// Config eksikse uyarı ver, uygulama yine de açılsın
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "Firebase config eksik. .env.local dosyasına NEXT_PUBLIC_FIREBASE_PROJECT_ID ve NEXT_PUBLIC_FIREBASE_API_KEY ekleyin."
    );
  }
}

const app =
  getApps().length > 0
    ? getApp()
    : firebaseConfig.projectId && firebaseConfig.apiKey
      ? initializeApp(firebaseConfig)
      : initializeApp({
          ...firebaseConfig,
          apiKey: firebaseConfig.apiKey || "demo",
          projectId: firebaseConfig.projectId || "demo-project",
          measurementId: firebaseConfig.measurementId || undefined,
        });
export const db = getFirestore(app);
export const storage = getStorage(app);

// Tarayıcıda kalıcı oturum (YouTube gibi): çıkış yapana veya hesap değiştirene kadar hatırla
const isBrowser = typeof window !== "undefined";
export const auth = isBrowser
  ? (() => {
      try {
        return initializeAuth(app, { persistence: browserLocalPersistence });
      } catch {
        return getAuth(app);
      }
    })()
  : getAuth(app);

// Emulator: NEXT_PUBLIC_USE_AUTH_EMULATOR=true ile tüm giriş yöntemleri anında çalışır
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  } catch {}
}

const saveUserToFirestore = async (user: User, photoURL?: string) => {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);
  const displayName = user.displayName || user.email?.split("@")[0] || "Kullanıcı";
  const isNewUser = !docSnap.exists();
  const ecosystemOwnerUid = getEcosystemOwnerUid();
  await setDoc(
    userRef,
    {
      displayName,
      displayNameLower: displayName.toLowerCase(),
      photoURL: photoURL || user.photoURL,
      email: user.email,
      ...(ecosystemOwnerUid ? { [ECOSYSTEM_OWNER_FIELD]: ecosystemOwnerUid } : {}),
      ...(isNewUser ? { subscribers: [] } : {}),
      ...(isNewUser
        ? {
            role: "explorer",
            trustScore: 10,
            totalEarnings: 0,
            balance: 0,
            contentCount: 0,
            approvedContentCount: 0,
            isBanned: false,
            strikes: 0,
            createdAt: serverTimestamp(),
          }
        : {}),
    },
    { merge: true }
  );
};

/** Google girişi redirect ile (aynı sekmede Google'a gider). */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
  return null as unknown as Awaited<ReturnType<typeof signInWithPopup>>;
};

/** Google girişi popup ile; oturum düşüyorsa bunu deneyin (aynı pencerede kalır). */
export const signInWithGooglePopup = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await saveUserToFirestore(result.user);
  return result;
};

/** Redirect ile döndükten sonra sayfa yüklendiğinde çağrılmalı; giriş tamamlanır. */
export async function handleRedirectResult(): Promise<void> {
  const result = await getRedirectResult(auth);
  if (result?.user) await saveUserToFirestore(result.user);
}

export const signInWithYahoo = async () => {
  const provider = new OAuthProvider("yahoo.com");
  const result = await signInWithPopup(auth, provider);
  await saveUserToFirestore(result.user);
  return result;
};

export const signInWithMicrosoft = async () => {
  const provider = new OAuthProvider("microsoft.com");
  const result = await signInWithPopup(auth, provider);
  await saveUserToFirestore(result.user);
  return result;
};

export const signInWithApple = async () => {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  await saveUserToFirestore(result.user);
  return result;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await saveUserToFirestore(result.user);
  try {
    await sendEmailVerification(result.user);
  } catch {
    // Doğrulama e-postası gönderilemezse sessizce devam et
  }
  return result;
};

export const signInWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const updateUserProfile = async (uid: string, data: { displayName?: string; photoURL?: string }) => {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) return;
  if (data.displayName) await updateProfile(user, { displayName: data.displayName });
  if (data.photoURL) await updateProfile(user, { photoURL: data.photoURL });
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, data, { merge: true });
};

/** Giriş yapan kullanıcıyı ekosistem sahibi UID altına bağlar (her girişte merge). */
export async function ensureUserInEcosystem(uid: string): Promise<void> {
  const owner = getEcosystemOwnerUid();
  if (!owner || !uid) return;
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { [ECOSYSTEM_OWNER_FIELD]: owner }, { merge: true });
}

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const path = `users/${uid}/avatar_${Date.now()}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
