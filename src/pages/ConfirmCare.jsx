import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getDog } from '../db/dogs.js';
import { logCareEvent } from '../db/careEvents.js';
import { scheduleSmartReminders } from '../utils/notifications.js';
import { notifyOtherMembers } from '../utils/pushNotify.js';
import './Home.css';

const CARE_LABELS = {
  feed: { verb: 'feed', icon: '🍖' },
  walk: { verb: 'walk', icon: '🐾' },
  play: { verb: 'play with', icon: '🎾' },
  bath: { verb: 'bathe', icon: '🛁' },
};

function ConfirmCare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { household, user } = useAuth();

  const careType = searchParams.get('careType');
  const dogId = searchParams.get('dogId');

  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (household?.id && dogId) loadDog();
  }, [household?.id, dogId]);

  async function loadDog() {
    const d = await getDog(household.id, dogId);
    setDog(d);
    setLoading(false);
  }

  async function handleConfirm() {
    if (!dog || busy) return;
    setBusy(true);

    try {
      await logCareEvent(
        household.id,
        dog.id,
        careType,
        careType === 'feed' ? null : 20,
        user.uid,
        user.displayName || user.email
      );

      await notifyOtherMembers({
        household,
        loggerUid: user.uid,
        loggerName: user.displayName || user.email,
        dogName: dog.name,
        careType,
      });

      await scheduleSmartReminders(household.id, dog.id);

      navigate('/');
    } catch (err) {
      console.error('Failed to confirm care event:', err);
      setBusy(false);
    }
  }

  function handleDismiss() {
    navigate('/');
  }

  if (loading) return <p>Loading...</p>;

  if (!dog || !careType) {
    return (
      <div className="care-card">
        <h2>Something's off</h2>
        <p className="care-note">This reminder doesn't match a dog anymore.</p>
        <button className="btn btn-primary log-btn" onClick={() => navigate('/')}>
          Go home
        </button>
      </div>
    );
  }

  const label = CARE_LABELS[careType] || { verb: 'care for', icon: '🐾' };

  return (
    <div className="care-card confirm-care-card">
      <div className="confirm-care-icon">{label.icon}</div>
      <h2>Did you {label.verb} {dog.name}?</h2>

      <div className="confirm-care-actions">
        <button className="btn btn-primary confirm-care-btn" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Logging…' : 'Yes, done'}
        </button>
        <button className="btn btn-secondary confirm-care-btn" onClick={handleDismiss} disabled={busy}>
          Not yet
        </button>
      </div>
    </div>
  );
}

export default ConfirmCare;