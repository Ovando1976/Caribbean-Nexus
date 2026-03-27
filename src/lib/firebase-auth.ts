import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export function waitForFirebaseUser(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }

        try {
          await signInAnonymously(auth);
        } catch (error) {
          unsubscribe();
          reject(error);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}
