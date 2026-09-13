import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { signUpWithEmail, signInWithEmail, sendVerificationEmail, logOut } from '../auth/authService.js';
import { getHouseholdByInviteCode, joinHouseholdByCode, setPendingInviteCode } from '../db/households.js';
import './Auth.css';

function JoinHousehold({ inviteCode }) {
  const { user, household, emailVerified, refreshHousehold, refreshEmailVerification } = useAuth();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(true);

  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    loadPreview();
  }, [inviteCode]);

  async function loadPreview() {
    setPreviewLoading(true);
    try {
      const h = await getHouseholdByInviteCode(inviteCode);
      if (!h) {
        setPreviewError('This invite link is invalid or has expired.');
      } else {
        setPreview(h);
      }
    } catch (err) {
      console.error('loadPreview failed:', err);
      setPreviewError('Could not load this invite. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function completeJoin(uid) {
    await joinHouseholdByCode(uid, inviteCode);
    await refreshHousehold();
    setJoined(true);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setError('');

    if (authMode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    try {
      if (authMode === 'signup') {
        // Don't join yet — the account isn't verified. Stash the invite
        // code on the user doc; AuthContext completes the join
        // automatically the moment verification succeeds, however/
        // wherever that happens.
        const newUser = await signUpWithEmail(email.trim(), password, name.trim());
        await setPendingInviteCode(newUser.uid, inviteCode);
        setAwaitingVerification(true);
      } else {
        // signInWithEmail already enforces that the account is verified
        // (it signs the user back out otherwise), so it's safe to join
        // immediately on this path.
        const signedInUser = await signInWithEmail(email.trim(), password);
        await completeJoin(signedInUser.uid);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinAsSignedInUser() {
    setError('');
    setBusy(true);
    try {
      await completeJoin(user.uid);
    } catch (err) {
      setError(err.message || 'Could not join household.');
    } finally {
      setBusy(false);
    }
  }

  // Used on the "waiting for verification" screen — checks whether the
  // email has been verified yet without requiring a page reload. If it
  // has, refreshEmailVerification also resolves any pending household
  // join (via AuthContext), so we can go straight into the app.
  async function handleCheckVerification() {
    setError('');
    setVerificationMessage('');
    setBusy(true);

    try {
      const verified = await refreshEmailVerification();

      if (verified) {
        navigate('/', { replace: true });
        return;
      }

      setError('Your email is not verified yet. Please click the link in the email first.');
    } catch (err) {
      setError('We could not check your verification status. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResendVerification() {
    setError('');
    setVerificationMessage('');
    setBusy(true);

    try {
      await sendVerificationEmail();
      setVerificationMessage('Verification email sent again. Please check your inbox and spam folder.');
    } catch (err) {
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setBusy(false);
    }
  }

  // Lets someone stuck on either verification screen back out to the
  // normal sign-in/signup form instead of being stranded — signs out
  // (since they're mid-verification, not fully in) and resets local
  // state so the bottom form renders again.
  async function handleBackToSignIn() {
    setError('');
    setBusy(true);
    try {
      await logOut();
      setAwaitingVerification(false);
      setVerificationMessage('');
      setPassword('');
    } catch (err) {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (previewLoading) {
    return (
      <div className="auth-page">
        <div className="care-card auth-card">
          <p className="auth-subtitle">Loading invite…</p>
        </div>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="auth-page">
        <div className="care-card auth-card">
          <h2 className="auth-title">Invite not found</h2>
          <p className="auth-subtitle">{previewError}</p>
        </div>
      </div>
    );
  }

  // Signed out, just finished signup — waiting on email verification
  // before the join can complete. Matches Login.jsx's VerificationScreen:
  // the person can check right here instead of reloading the page.
  if (awaitingVerification) {
    return (
      <div className="auth-page">
        <div className="auth-badge">✉️</div>
        <div className="care-card auth-card">
          <h2 className="auth-title">Check your email</h2>

          <p className="auth-subtitle">
            We've sent a verification link to <strong>{email || 'your email address'}</strong>.
          </p>

          <p className="auth-subtitle">
            Once verified, you'll automatically be added to{' '}
            {preview?.name || 'the household'}.
          </p>

          {verificationMessage && <p className="form-success">{verificationMessage}</p>}
          {error && <p className="form-error">{error}</p>}

          <button
            type="button"
            className="auth-submit"
            onClick={handleCheckVerification}
            disabled={busy}
          >
            {busy ? 'Checking…' : "I've verified my email"}
          </button>

          <button
            type="button"
            className="back-link"
            onClick={handleResendVerification}
            disabled={busy}
          >
            Resend verification email
          </button>

          <button
            type="button"
            className="back-link"
            onClick={handleBackToSignIn}
            disabled={busy}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // Already signed in
  if (user) {
    // Signed in but not verified yet — block joining until they are,
    // regardless of how they landed on this page. Same inline check,
    // no page reload needed.
    if (!emailVerified) {
      return (
        <div className="auth-page">
          <div className="auth-badge">✉️</div>
          <div className="care-card auth-card">
            <h2 className="auth-title">Verify your email first</h2>
            <p className="auth-subtitle">
              Please verify your email before joining {preview?.name || 'this household'}.
              Check your inbox for the verification link.
            </p>

            {verificationMessage && <p className="form-success">{verificationMessage}</p>}
            {error && <p className="form-error">{error}</p>}

            <button
              type="button"
              className="auth-submit"
              onClick={handleCheckVerification}
              disabled={busy}
            >
              {busy ? 'Checking…' : "I've verified my email"}
            </button>

            <button
              type="button"
              className="back-link"
              onClick={handleResendVerification}
              disabled={busy}
            >
              Resend verification email
            </button>

            <button
              type="button"
              className="back-link"
              onClick={handleBackToSignIn}
              disabled={busy}
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      );
    }

    // Already in this exact household
    if (household?.inviteCode === inviteCode || household?.id === preview?.id) {
      return (
        <div className="auth-page">
          <div className="care-card auth-card">
            <h2 className="auth-title">You're already in {preview?.name}</h2>
            <button className="auth-submit" onClick={() => navigate('/', { replace: true })}>
              Go to app
            </button>
          </div>
        </div>
      );
    }

    // Already in a different household
    if (household) {
      return (
        <div className="auth-page">
          <div className="care-card auth-card">
            <h2 className="auth-title">You're already in a household</h2>
            <p className="auth-subtitle">
              You're currently part of "{household.name}". Leave that household in
              Settings before joining a different one.
            </p>
            <button className="auth-submit" onClick={() => navigate('/', { replace: true })}>
              Go to app
            </button>
          </div>
        </div>
      );
    }

    if (joined) {
      return (
        <div className="auth-page">
          <div className="care-card auth-card">
            <h2 className="auth-title">You're in! 🎉</h2>
            <p className="auth-subtitle">You've joined {preview?.name}.</p>
            <button className="auth-submit" onClick={() => navigate('/', { replace: true })}>
              Go to app
            </button>
          </div>
        </div>
      );
    }

    // Signed in, verified, no household yet — simple confirm
    return (
      <div className="auth-page">
        <div className="auth-badge">🐾</div>
        <div className="care-card auth-card">
          <h2 className="auth-title">Join {preview?.name}?</h2>
          <p className="auth-subtitle">You'll be added as a member of this household.</p>

          {error && <p className="form-error">{error}</p>}

          <button className="auth-submit" onClick={handleJoinAsSignedInUser} disabled={busy}>
            {busy ? 'Joining…' : `Join ${preview?.name}`}
          </button>
        </div>
      </div>
    );
  }

  // Signed out — signup/signin form
  return (
    <div className="auth-page">
      <div className="auth-badge">🐾</div>
      <div className="care-card auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => { setAuthMode('signup'); setError(''); }}
          >
            Create account
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === 'signin' ? 'active' : ''}`}
            onClick={() => { setAuthMode('signin'); setError(''); }}
          >
            Sign in
          </button>
        </div>

        <h2 className="auth-title">Join {preview?.name}</h2>
        <p className="auth-subtitle">
          {authMode === 'signup'
            ? 'Create an account to join this household.'
            : 'Sign in to join this household.'}
        </p>

        <form onSubmit={handleAuthSubmit} className="dog-form">
          {authMode === 'signup' && (
            <div className="form-group">
              <label htmlFor="join-name">Your name</label>
              <input
                id="join-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ana"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="join-email">Email</label>
            <input
              id="join-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="join-password">Password</label>
            <input
              id="join-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : authMode === 'signup' ? 'Create account & join' : 'Sign in & join'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinHousehold;