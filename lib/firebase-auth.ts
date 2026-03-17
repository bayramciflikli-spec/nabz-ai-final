import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  OAuthProvider,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, googleProvider } from "./firebase";
import { getEcosystemOwnerUid, ECOSYSTEM_OWNER_FIELD } from "./ecosystem";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

async function saveUserToFirestore(user: User, photoURL?: string) {
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
}

export function getAuthConfigStatus(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!(firebaseConfig.apiKey || "").trim()) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!(firebaseConfig.authDomain || "").trim()) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!(firebaseConfig.projectId || "").trim()) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  return { ok: missing.length === 0, missing };
}

export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
    return null as unknown as Awaited<ReturnType<typeof signInWithPopup>>;
  } catch (err) {
    console.error("[Firebase Auth] signInWithRedirect hatası:", err);
    throw err;
  }
};

export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    try {
      await saveUserToFirestore(result.user);
    } catch {
      // Firestore hatası girişi engellemesin; kullanıcı yine giriş yapmış sayılır
    }
    return result;
  } catch (err) {
    console.error("[Firebase Auth] signInWithPopup hatası:", err);
    throw err;
  }
};

/** Google redirect dönüşünde çağrılmalı; mobilde girişin tamamlanması için sayfa yüklenir yüklenmez çalışsın. */
export async function handleRedirectResult(): Promise<void> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      try {
        await saveUserToFirestore(result.user);
      } catch {
        // Firestore hatası girişi engellemesin
      }
    }
  } catch (err) {
    console.error("[Firebase Auth] getRedirectResult hatası:", err);
  }
}

export const signInWithYahoo = async () => {
  const provider = new OAuthProvider("yahoo.com");
  const result = await signInWithPopup(auth, provider);
  try {
    await saveUserToFirestore(result.user);
  } catch {
    // Firestore hatası girişi engellemesin
  }
  return result;
};

export const signInWithMicrosoft = async () => {
  const provider = new OAuthProvider("microsoft.com");
  const result = await signInWithPopup(auth, provider);
  try {
    await saveUserToFirestore(result.user);
  } catch {
    // Firestore hatası girişi engellemesin
  }
  return result;
};

export const signInWithApple = async () => {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  try {
    await saveUserToFirestore(result.user);
  } catch {
    // Firestore hatası girişi engellemesin
  }
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

export const updateUserProfile = async (
  uid: string,
  data: { displayName?: string; photoURL?: string }
) => {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) return;
  if (data.displayName) await updateProfile(user, { displayName: data.displayName });
  if (data.photoURL) await updateProfile(user, { photoURL: data.photoURL });
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, data, { merge: true });
};

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
