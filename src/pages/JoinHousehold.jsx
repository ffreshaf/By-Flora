import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { signUpWithEmail, signInWithEmail } from '../auth/authService.js';
import { getHouseholdByInviteCode, joinHouseholdByCode } from '../db/households.js';
import './Auth.css';

function JoinHousehold({ inviteCode }) {
  const { user, household, refreshHousehold } = useAuth();
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

  async function completeJoin() {
    await joinHouseholdByCode(user.uid, inviteCode);
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
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      await completeJoin();
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
      await completeJoin();
    } catch (err) {
      setError(err.message || 'Could not join household.');
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

  // Already signed in
  if (user) {
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

    // Signed in, no household yet — simple confirm
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

  // Signed out — signup/signin then auto-join
  if (joined) {
    return (
      <div className="auth-page">
        <div className="care-card auth-card">
          <h2 className="auth-title">You're in! 🎉</h2>
          <p className="auth-subtitle">
            You've joined {preview?.name}. Check your email to verify your account,
            then open the app.
          </p>
        </div>
      </div>
    );
  }

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