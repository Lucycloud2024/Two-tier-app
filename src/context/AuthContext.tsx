import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../firebase';
import { CustomerShippingInfo, OperationType } from '../types';
import { BOUNDS, sanitizeDisplayName } from '../validation';

interface AuthContextValue {
  user: User | null;
  isAuthReady: boolean;
  profileReady: boolean;
  displayName: string;
  savedShipping: CustomerShippingInfo | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean }>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  updateDisplayName: (newName: string) => Promise<void>;
  saveShippingProfile: (info: CustomerShippingInfo) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savedShipping, setSavedShipping] = useState<CustomerShippingInfo | null>(null);

  const ensureFirestoreProfile = useCallback(async (currentUser: User) => {
    if (!currentUser.emailVerified) {
      setProfileReady(false);
      setDisplayName(
        sanitizeDisplayName(
          currentUser.displayName || currentUser.email?.split('@')[0] || 'Solar Customer'
        )
      );
      return;
    }

    const publicPath = `users/${currentUser.uid}/public/profile`;
    const publicRef = doc(db, 'users', currentUser.uid, 'public', 'profile');

    let finalName = sanitizeDisplayName(
      currentUser.displayName || currentUser.email?.split('@')[0] || 'Solar Customer'
    );

    try {
      const pubSnap = await getDoc(publicRef);
      if (!pubSnap.exists()) {
        try {
          await setDoc(publicRef, {
            uid: currentUser.uid,
            displayName: finalName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, publicPath);
        }
      } else {
        const data = pubSnap.data();
        if (typeof data.displayName === 'string' && data.displayName.trim()) {
          finalName = data.displayName;
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, publicPath);
    }

    setDisplayName(finalName);
    setProfileReady(true);

    const privatePath = `users/${currentUser.uid}/private/info`;
    const privateRef = doc(db, 'users', currentUser.uid, 'private', 'info');
    try {
      const privSnap = await getDoc(privateRef);
      if (privSnap.exists()) {
        const d = privSnap.data();
        setSavedShipping({
          email: String(d.email || currentUser.email || ''),
          phone: String(d.phone || ''),
          shippingAddress: String(d.shippingAddress || ''),
          shippingCity: String(d.shippingCity || ''),
          postalCode: String(d.postalCode || ''),
        });
      } else {
        setSavedShipping(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, privatePath);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await ensureFirestoreProfile(currentUser);
      } else {
        setProfileReady(false);
        setDisplayName('');
        setSavedShipping(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [ensureFirestoreProfile]);

  const signInWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureFirestoreProfile(credential.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await ensureFirestoreProfile(credential.user);
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ needsVerification: boolean }> => {
    const cleanName = sanitizeDisplayName(name);
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: cleanName });
    if (!credential.user.emailVerified) {
      await sendEmailVerification(credential.user);
      setDisplayName(cleanName);
      return { needsVerification: true };
    }
    await ensureFirestoreProfile(credential.user);
    return { needsVerification: false };
  };

  const resendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const refreshed = auth.currentUser;
    setUser({ ...refreshed } as User);
    if (refreshed.emailVerified) {
      await ensureFirestoreProfile(refreshed);
      return true;
    }
    return false;
  };

  const updateDisplayName = async (newName: string) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    const clean = sanitizeDisplayName(newName).slice(0, BOUNDS.DISPLAY_NAME_MAX);
    const publicPath = `users/${auth.currentUser.uid}/public/profile`;
    const publicRef = doc(db, 'users', auth.currentUser.uid, 'public', 'profile');
    try {
      await updateDoc(publicRef, {
        displayName: clean,
        updatedAt: serverTimestamp(),
      });
      await updateProfile(auth.currentUser, { displayName: clean });
      setDisplayName(clean);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, publicPath);
    }
  };

  const saveShippingProfile = async (info: CustomerShippingInfo) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    const uid = auth.currentUser.uid;
    const privatePath = `users/${uid}/private/info`;
    const privateRef = doc(db, 'users', uid, 'private', 'info');

    const cleanPayload = {
      email: info.email.trim().slice(0, BOUNDS.EMAIL_MAX),
      phone: info.phone.trim().slice(0, BOUNDS.PHONE_MAX),
      shippingAddress: info.shippingAddress.trim().slice(0, BOUNDS.ADDRESS_MAX),
      shippingCity: info.shippingCity.trim().slice(0, BOUNDS.CITY_MAX),
      postalCode: info.postalCode.trim().slice(0, BOUNDS.POSTAL_MAX),
    };

    let exists = false;
    try {
      const snap = await getDoc(privateRef);
      exists = snap.exists();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, privatePath);
    }

    if (!exists) {
      try {
        await setDoc(privateRef, {
          uid,
          ...cleanPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, privatePath);
      }
    } else {
      try {
        await updateDoc(privateRef, {
          ...cleanPayload,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, privatePath);
      }
    }

    setSavedShipping(cleanPayload);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        profileReady,
        displayName,
        savedShipping,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resendVerification,
        refreshVerificationStatus,
        updateDisplayName,
        saveShippingProfile,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
