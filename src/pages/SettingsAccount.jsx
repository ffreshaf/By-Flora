import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  updateNickname,
  requestEmailChange,
  updateUserPassword,
} from '../auth/authService.js';
import './Home.css';

function AccountSettings() {
  const { user } = useAuth();

  const [nickname, setNickname] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  function flashSaved(label) {
    setSaved(label);
    setTimeout(() => setSaved(''), 2500);
  }

  async function handleNicknameSave(e) {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) {
      setError('Nickname can\'t be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateNickname(nickname.trim());
      flashSaved('Nickname updated');
    } catch (err) {
      setError(err.message || 'Could not update nickname.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailSave(e) {
    e.preventDefault();
    setError('');
    if (!currentPassword) {
        setError('Enter your current password to change email.');
        return;
    }
    setSaving(true);
    try {
        await requestEmailChange(email.trim(), currentPassword);
        setCurrentPassword('');
        flashSaved('Check your new inbox to confirm the change');
    } catch (err) {
        setError(err.message || 'Could not update email.');
    } finally {
        setSaving(false);
    }
    }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setError('');
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      flashSaved('Password updated');
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="care-card">
      <Link to="/settings" className="settings-back-link">‹ Settings</Link>
      <h2>Account</h2>

      {saved && (
        <div className="save-confirmation">
          <span className="save-check">✓</span>
          {saved}
        </div>
      )}
      {error && <p className="form-error">{error}</p>}

      <p className="settings-section-label">Nickname</p>
      <form className="dog-form" onSubmit={handleNicknameSave}>
        <div className="form-group">
          <label htmlFor="nickname">Display name</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving}>Save nickname</button>
      </form>

      <p className="settings-section-label">Email</p>
      <form className="dog-form" onSubmit={handleEmailSave}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email-current-password">Current password</label>
          <input
            id="email-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Required to confirm this change"
          />
        </div>
        <button type="submit" disabled={saving}>Save email</button>
      </form>

      <p className="settings-section-label">Password</p>
      <form className="dog-form" onSubmit={handlePasswordSave}>
        <div className="form-group">
          <label htmlFor="pw-current">Current password</label>
          <input
            id="pw-current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="pw-new">New password</label>
          <input
            id="pw-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <small>At least 6 characters.</small>
        </div>
        <button type="submit" disabled={saving}>Save password</button>
      </form>
    </div>
  );
}

export default AccountSettings;