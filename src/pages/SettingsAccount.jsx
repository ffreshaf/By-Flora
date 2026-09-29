import { useState } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.jsx';

import {
  updateNickname,
  requestEmailChange,
  updateUserPassword,
  reauthenticateWithPassword,
  reauthenticateWithGoogle,
  logOut,
} from '../auth/authService.js';

import { deleteAccount } from '../db/households.js';

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

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isGoogleUser = user?.providerData?.some(
    (provider) => provider.providerId === 'google.com'
  );

  function flashSaved(label) {
    setSaved(label);
    setTimeout(() => setSaved(''), 2500);
  }

  async function handleNicknameSave(e) {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError("Nickname can't be empty.");
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

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Delete your By Flora account?\n\n' +
      'Your account and personal data will be permanently deleted. ' +
      'If you are the last member of your household, the household, dogs, ' +
      'care history and reminders will also be deleted.\n\n' +
      'This cannot be undone.'
    );

    if (!confirmed) return;

    setError('');
    setDeleting(true);

    try {
      if (isGoogleUser) {
        await reauthenticateWithGoogle();
      } else {
        await reauthenticateWithPassword(deletePassword);
      }

      await deleteAccount();
      await logOut();
    } catch (err) {
      setError(
        err.message || 'Could not delete your account.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="care-card">

      <Link to="/settings" className="settings-back-link">
        ‹ Settings
      </Link>

      <h2>Account</h2>

      {saved && (
        <div className="save-confirmation">
          <span className="save-check">✓</span>
          {saved}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <p className="settings-section-label">
        Nickname
      </p>

      <form className="dog-form" onSubmit={handleNicknameSave}>
        <div className="form-group">
          <label htmlFor="nickname">
            Display name
          </label>

          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button type="submit" disabled={saving}>
          Save nickname
        </button>
      </form>

      <p className="settings-section-label">
        Email
      </p>

      <form className="dog-form" onSubmit={handleEmailSave}>
        <div className="form-group">
          <label htmlFor="email">
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-current-password">
            Current password
          </label>

          <input
            id="email-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Required to confirm this change"
          />
        </div>

        <button type="submit" disabled={saving}>
          Save email
        </button>
      </form>

      <p className="settings-section-label">
        Password
      </p>

      <form className="dog-form" onSubmit={handlePasswordSave}>
        <div className="form-group">
          <label htmlFor="pw-current">
            Current password
          </label>

          <input
            id="pw-current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pw-new">
            New password
          </label>

          <input
            id="pw-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <small>
            At least 6 characters.
          </small>
        </div>

        <button type="submit" disabled={saving}>
          Save password
        </button>
      </form>

      <div style={{ marginTop: 40 }}>

        <p className="settings-section-label">
          Danger zone
        </p>

        <div className="custom-reminder-card">

          <div>
            <strong>
              Delete account
            </strong>

            <small>
              Permanently delete your By Flora account and personal data.
            </small>
          </div>

          {!isGoogleUser && (
            <div className="form-group">
              <label htmlFor="delete-password">
                Current password
              </label>

              <input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Required to confirm deletion"
              />
            </div>
          )}

          <button
            className="settings-nav-item settings-nav-danger"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting
              ? 'Deleting…'
              : isGoogleUser
                ? 'Continue with Google to delete'
                : 'Delete account'}
          </button>

        </div>

      </div>

    </div>
  );
}

export default AccountSettings;
