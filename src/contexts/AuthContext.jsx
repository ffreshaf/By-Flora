// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../auth/authService.js';
import { getMyUserDoc, getHousehold } from '../db/households.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [userDoc, setUserDoc] = useState(null);  // users/{uid} doc
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ user, userDoc, household, loading, refreshHousehold }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}