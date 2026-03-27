import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;

  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
  }
}
