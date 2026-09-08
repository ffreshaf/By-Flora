import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from '../auth/authService.js';
import './Auth.css';

function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name.');
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setBusy(true);

    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setResetSent(false);
  }

  if (mode === 'reset') {
    return (
      <div className="auth-page">
        <div className="auth-badge">🔑</div>

        <div className="care-card auth-card">
          <h2 className="auth-title">Reset your password</h2>

          {resetSent ? (
            <>
              <p className="auth-subtitle">
                We've sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder) for the link.
              </p>
              <button type="button" className="back-link" onClick={() => switchMode('signin')}>
                ← Back to sign in
              </button>
            </>
          ) : (
            <>
              <p className="auth-subtitle">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleReset} className="dog-form">
                <div className="form-group">
                  <label htmlFor="reset-email">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>

                {error && <p className="form-error">{error}</p>}

                <button type="submit" className="auth-submit" disabled={busy}>
                  {busy ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <button type="button" className="back-link" onClick={() => switchMode('signin')}>
                ← Back to sign in
              </button>
            </>
          )}
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
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        <h2 className="auth-title">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'signup'
            ? "Set up your account to start caring for her together."
            : 'Sign in to see how she\'s doing today.'}
        </p>

        <form onSubmit={handleSubmit} className="dog-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Your name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ana" />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {mode === 'signin' && (
            <button type="button" className="auth-forgot-link" onClick={() => switchMode('reset')}>
              Forgot password?
            </button>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="auth-google-btn" onClick={handleGoogle} disabled={busy}>
          <svg className="auth-google-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'That email is already registered — try signing in instead.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Incorrect email or password.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('user-not-found')) return 'No account found with that email.';
  return err.message || 'Something went wrong. Please try again.';
}

export default Login;