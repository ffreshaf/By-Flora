import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { logOut } from '../auth/authService.js';
import './Home.css';

function Settings() {
  const { household } = useAuth();

  async function handleSignOut() {
    if (!confirm('Sign out?')) return;
    await logOut();
  }

  return (
    <div className="care-card">
      <h2>Settings</h2>

      <div className="settings-nav-list">
        <Link to="/settings/family" className="settings-nav-item">
          <span className="settings-nav-icon">🏡</span>
          <span className="settings-nav-text">
            <strong>Family</strong>
            <span>{household?.name || 'Manage your household'}</span>
          </span>
          <span className="settings-nav-chevron">›</span>
        </Link>

        <Link to="/settings/dogs" className="settings-nav-item">
          <span className="settings-nav-icon">🐶</span>
          <span className="settings-nav-text">
            <strong>Dog profiles</strong>
            <span>Add, edit, or remove dogs</span>
          </span>
          <span className="settings-nav-chevron">›</span>
        </Link>

        <Link to="/settings/care-targets" className="settings-nav-item">
          <span className="settings-nav-icon">🎯</span>
          <span className="settings-nav-text">
            <strong>Care targets</strong>
            <span>Food, exercise & hygiene overrides</span>
          </span>
          <span className="settings-nav-chevron">›</span>
        </Link>

        <Link to="/settings/reminders" className="settings-nav-item">
          <span className="settings-nav-icon">⏰</span>
          <span className="settings-nav-text">
            <strong>Custom reminders</strong>
            <span>One-off or repeating reminders</span>
          </span>
          <span className="settings-nav-chevron">›</span>
        </Link>

        <Link to="/settings/reminder-times" className="settings-nav-item">
          <span className="settings-nav-icon">🔔</span>
          <span className="settings-nav-text">
            <strong>Reminder times</strong>
            <span>When feeding & walk alerts fire</span>
          </span>
          <span className="settings-nav-chevron">›</span>
        </Link>

        <Link to="/about" className="settings-nav-item">
          <span className="settings-nav-icon">ℹ️</span>
          <span className="settings-nav-text">
            <strong>About By Flora</strong>
          </span>
          <span className="settings-nav-chevron">›</span>
        </Link>

        <button className="settings-nav-item settings-nav-danger" onClick={handleSignOut}>
          <span className="settings-nav-icon">🚪</span>
          <span className="settings-nav-text">
            <strong>Sign out</strong>
          </span>
        </button>
      </div>
    </div>
  );
}

export default Settings;