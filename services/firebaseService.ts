import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { FirebaseConfig, Tool, Workflow, Prompt, PromptCategory } from '../types';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const isFirebaseInitialized = () => !!app;

export const initFirebase = (config: FirebaseConfig) => {
  if (!app) {
    try {
      app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log("Firebase initialized successfully");
    } catch (e) {
      console.error("Firebase initialization error:", e);
      throw e;
    }
  }
  return app;
};

export const loginWithGoogle = async (): Promise<User> => {
  if (!auth) throw new Error("Firebase not initialized");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    // Rethrow error so App.tsx can handle specific codes (e.g. auth/unauthorized-domain)
    throw error;
  }
};

export const logoutFirebase = async () => {
  if (!auth) return;
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

interface UserData {
  tools: Tool[];
  workflows: Workflow[];
  prompts?: Prompt[];
  promptCategories?: PromptCategory[];
}

export const saveUserDataToCloud = async (userId: string, data: UserData) => {
  if (!db) throw new Error("Database not initialized");
  await setDoc(doc(db, "users", userId), {
    ...data,
    lastUpdated: new Date().toISOString()
  });
};

export const loadUserDataFromCloud = async (userId: string) => {
  if (!db) throw new Error("Database not initialized");
  const snap = await getDoc(doc(db, "users", userId));
  if (snap.exists()) {
    return snap.data() as UserData;
  }
  return null;
};

export const subscribeToUserData = (
  userId: string, 
  onData: (data: UserData) => void
) => {
  if (!db) throw new Error("Database not initialized");
  
  // Return the unsubscribe function
  return onSnapshot(doc(db, "users", userId), (doc) => {
    if (doc.exists()) {
      const data = doc.data() as UserData;
      onData(data);
    }
  });
};

export const testFirestoreConnection = async () => {
  if (!db) throw new Error("Database not initialized");
  try {
    // Try to read a non-existent doc to check connection/permissions
    await getDoc(doc(db, "test_connection", "ping"));
    return { success: true, message: "Verbindung zu Firestore erfolgreich hergestellt!" };
  } catch (e: any) {
    console.error("Firestore connection test failed:", e);
    return { success: false, message: e.message };
  }
};
