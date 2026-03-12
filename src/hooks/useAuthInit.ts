import { useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '../lib/store';
import { usersService } from '../services';

export function useAuthInit() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let profile = await usersService.getProfile(firebaseUser.uid);
          
          if (!profile) {
            // Auto-create profile if missing (onboarding would be better but this is MVP)
            const username = firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 5)}`;
            await usersService.createProfile(firebaseUser.uid, {
              email: firebaseUser.email || '',
              username,
              displayName: firebaseUser.displayName || username,
            });
            profile = await usersService.getProfile(firebaseUser.uid);
          }
          
          setProfile(profile);
        } catch (error) {
          console.error("Error initializing profile:", error);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setProfile, setLoading]);
}
