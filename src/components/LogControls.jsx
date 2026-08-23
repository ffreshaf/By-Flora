import { useState } from 'react';

const PRESETS = [10, 15, 20, 30, 45, 60];

function LogControls({ onLog }) {
  const [customValue, setCustomValue] = useState('');

  function handleCustomLog() {
    const minutes = Number(customValue);
    if (!minutes || minutes <= 0) return;
    onLog(minutes);
    setCustomValue('');
  }

  return (
    <div>
      <div className="chip-row">
        {PRESETS.map((min) => (
          <button key={min} className="chip" onClick={() => onLog(min)}>{min}m</button>
        ))}
      </div>
      <div className="custom-log-row">
        <input
          type="number"
          min="1"
          placeholder="Other (min)"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
        />
        <button className="btn btn-secondary btn-small" onClick={handleCustomLog}>Log</button>
      </div>
    </div>
  );
}

export default LogControls;