import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getHouseholdMembers, leaveHousehold } from '../db/households.js';
import { Share } from '@capacitor/share';
import './Home.css';

function SettingsFamily() {
  const { user, household, refreshHousehold } = useAuth();
  const [members, setMembers] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (household) loadMembers();
  }, [household?.id]);

  async function loadMembers() {
    const list = await getHouseholdMembers(household.id);
    setMembers(list);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(household.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleShareInvite() {
    const link = `https://by-flora.web.app/join/${household.inviteCode}`;
    try {
      await Share.share({
        title: `Join ${household?.name} on By Flora`,
        text: `Join our household on By Flora to help take care of her!`,
        url: link,
      });
    } catch (err) {
      // user cancelled the share sheet — not an error worth surfacing
    }
  }

  async function handleLeaveHousehold() {
    if (!household) return;

    const isLastMember = members.length === 1;

    const message = isLastMember
      ? `You're the only member of ${household.name}.\n\nLeaving will permanently delete this household, its dogs, care history, reminders and settings.\n\nThis cannot be undone.`
      : `Leave ${household.name}?\n\nYou'll leave this household, but your account will remain. The dogs and care history will stay for the other members.`;

    if (!window.confirm(message)) {
      return;
    }

    setError('');
    setLeaving(true);

    try {
      await leaveHousehold();

      await refreshHousehold();
    } catch (err) {
      setError(err.message || 'Could not leave household.');
    } finally {
      setLeaving(false);
    }
  }

  if (!household) return <p>Loading...</p>;

  return (
    <div className="care-card">
      <Link to="/settings" className="settings-back-link">‹ Settings</Link>
      <h2>Family</h2>

      <div className="custom-reminder-card" style={{ marginBottom: 16 }}>
        <div>
          <strong>{household.name}</strong>
          <small>Invite code: {household.inviteCode}</small>
        </div>
        <button className="btn btn-secondary btn-small" onClick={handleCopyCode}>
          {codeCopied ? 'Copied!' : 'Copy code'}
        </button>

        <button className="btn btn-secondary btn-small" onClick={handleShareInvite}>
          Share invite link
        </button>
      </div>

      <p className="settings-section-label" style={{ marginTop: 0 }}>Members</p>
      <div className="custom-reminder-list">
        {members.map((m) => (
          <div className="custom-reminder-card" key={m.uid}>
            <div>
              <strong>{m.name}{m.uid === user.uid ? ' (you)' : ''}</strong>
              <small>{m.email}</small>
            </div>
          </div>
        ))}
      </div>

      {error && (<p className="form-error">{error}</p>)}

      <div style={{ marginTop: 32 }}>
        <p className="settings-section-label">Leave household</p>

        <p className="care-note">
          You'll leave this household but keep your By Flora account.
          Other members will keep the dogs and care history.
        </p>

        <button
          className="settings-nav-item settings-nav-danger"
          onClick={handleLeaveHousehold}
          disabled={leaving}
        >
          {leaving ? 'Leaving…' : 'Leave household'}
        </button>
      </div>
    </div>
  );
}

export default SettingsFamily;