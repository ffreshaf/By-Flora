import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getHouseholdMembers } from '../db/households.js';
import './Home.css';

function SettingsFamily() {
  const { user, household } = useAuth();
  const [members, setMembers] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);

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
    </div>
  );
}

export default SettingsFamily;