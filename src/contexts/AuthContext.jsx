// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, reloadCurrentUser } from '../auth/authService.js';
import { getMyUserDoc, getHousehold } from '../db/households.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [userDoc, setUserDoc] = useState(null);  // users/{uid} doc
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setUserDoc(null);
        setHousehold(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setEmailVerified(
        firebaseUser.providerData.some(
          provider => provider.providerId === 'google.com'
        ) || firebaseUser.emailVerified
      );

      const doc = await getMyUserDoc(firebaseUser.uid);
      setUserDoc(doc);

      if (doc?.householdId) {
        const h = await getHousehold(doc.householdId);
        setHousehold(h);
      } else {
        setHousehold(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);



  // Call this after joining/creating a household so state updates
  // without waiting for a full re-login.
  async function refreshHousehold() {
    if (!user) return;
    const doc = await getMyUserDoc(user.uid);
    setUserDoc(doc);
    if (doc?.householdId) {
      setHousehold(await getHousehold(doc.householdId));
    }
  }

  async function refreshEmailVerification() {
    const refreshedUser = await reloadCurrentUser();

    if (!refreshedUser) {
      setUser(null);
      setEmailVerified(false);
      return false;
    }

    const verified =
      refreshedUser.providerData.some(
        provider => provider.providerId === 'google.com'
      ) || refreshedUser.emailVerified;

    setUser(refreshedUser);
    setEmailVerified(verified);

    return verified;
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, household, loading, emailVerified, refreshHousehold, refreshEmailVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}