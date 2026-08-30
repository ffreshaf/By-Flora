import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createHousehold, joinHouseholdByCode } from '../db/households.js';
import './Auth.css';

function HouseholdSetup() {
  const { user, refreshHousehold } = useAuth();
  const [mode, setMode] = useState('choose'); // 'choose' | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { inviteCode } = await createHousehold(user.uid, name.trim() || 'Our household');
      setCreatedCode(inviteCode);
      await refreshHousehold();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await joinHouseholdByCode(user.uid, code);
      await refreshHousehold();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (createdCode) {
    return (
      <div className="auth-page">
        <div className="auth-badge">🎉</div>
        <div className="care-card auth-card">
          <h2 className="auth-title">Household created</h2>
          <p className="auth-subtitle">Share this invite code with your family:</p>
          <div className="invite-code-display">{createdCode}</div>
          <p className="care-note" style={{ margin: 0 }}>
            They'll enter this when joining, to connect to the same dog.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="auth-page">
        <div className="auth-badge">🏡</div>
        <div className="care-card auth-card">
          <h2 className="auth-title">Let's get set up</h2>
          <p className="auth-subtitle">
            Are you starting a new household, or joining one your family already made?
          </p>

          <button className="household-choice-btn" onClick={() => setMode('create')}>
            <span className="household-choice-icon">✨</span>
            <span className="household-choice-text">
              <strong>Create a household</strong>
              <span>Start fresh and invite your family</span>
            </span>
          </button>

          <button className="household-choice-btn" onClick={() => setMode('join')}>
            <span className="household-choice-icon">🔑</span>
            <span className="household-choice-text">
              <strong>Join with an invite code</strong>
              <span>Someone already set this up</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="auth-page">
        <div className="auth-badge">✨</div>
        <div className="care-card auth-card">
          <h2 className="auth-title">Create your household</h2>
          <p className="auth-subtitle">Give it a name your family will recognise.</p>

          <form onSubmit={handleCreate} className="dog-form">
            <div className="form-group">
              <label htmlFor="householdName">Household name</label>
              <input
                id="householdName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Silva Family"
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create household'}
            </button>
          </form>

          <button className="back-link" onClick={() => setMode('choose')}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-badge">🔑</div>
      <div className="care-card auth-card">
        <h2 className="auth-title">Join a household</h2>
        <p className="auth-subtitle">Enter the code someone in your family shared with you.</p>

        <form onSubmit={handleJoin} className="dog-form">
          <div className="form-group">
            <label htmlFor="inviteCode">Invite code</label>
            <input
              id="inviteCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. FLORA-7QK2"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Joining…' : 'Join household'}
          </button>
        </form>

        <button className="back-link" onClick={() => setMode('choose')}>← Back</button>
      </div>
    </div>
  );
}

export default HouseholdSetup;