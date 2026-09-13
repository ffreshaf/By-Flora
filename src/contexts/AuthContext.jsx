// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, reloadCurrentUser } from '../auth/authService.js';
import { getMyUserDoc, getHousehold, getHouseholdMembers, joinHouseholdByCode, clearPendingInviteCode } from '../db/households.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [userDoc, setUserDoc] = useState(null);  // users/{uid} doc
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setUserDoc(null);
        setHousehold(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const verified =
        firebaseUser.providerData.some(
          provider => provider.providerId === 'google.com'
        ) || firebaseUser.emailVerified;

      setEmailVerified(verified);

      let doc = await getMyUserDoc(firebaseUser.uid);

      // If verification is already satisfied and there's a pending invite
      // waiting on this account, complete the join now — this covers the
      // case where someone verifies on one device/tab and later opens the
      // app on another, or reopens it after closing the browser tab.
      if (verified) {
        doc = await maybeCompletePendingJoin(firebaseUser.uid, doc);
      }

      setUserDoc(doc);

      let h = null;
      if (doc?.householdId) {
        h = await getHousehold(doc.householdId);
      }
      setHousehold(h);

      if (h) {
        setMembers(await getHouseholdMembers(h.id));
      } else {
        setMembers([]);
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
      const h = await getHousehold(doc.householdId);
      setHousehold(h);
      setMembers(h ? await getHouseholdMembers(h.id) : []);
    } else {
      setHousehold(null);
      setMembers([]);
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

    // Same as above: the moment verification is confirmed (e.g. via the
    // "I've verified my email" button), resolve any pending household join
    // immediately so the person lands straight in the app instead of
    // HouseholdSetup.
    if (verified) {
      let doc = await getMyUserDoc(refreshedUser.uid);
      doc = await maybeCompletePendingJoin(refreshedUser.uid, doc);
      setUserDoc(doc);

      if (doc?.householdId) {
        const h = await getHousehold(doc.householdId);
        setHousehold(h);
        setMembers(h ? await getHouseholdMembers(h.id) : []);
      } else {
        setHousehold(null);
        setMembers([]);
      }
    }

    return verified;
  }

  async function maybeCompletePendingJoin(uid, userDoc) {
    if (!userDoc?.pendingInviteCode) return userDoc;
    try {
      await joinHouseholdByCode(uid, userDoc.pendingInviteCode);
      await clearPendingInviteCode(uid);
      return await getMyUserDoc(uid);
    } catch (err) {
      console.error('Failed to complete pending household join:', err);
      return userDoc; // leave pendingInviteCode in place, retry next time
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        household,
        members,
        loading,
        emailVerified,
        refreshHousehold,
        refreshEmailVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}