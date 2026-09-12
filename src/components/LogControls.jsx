import { useState } from 'react';

const STEP = 5;
const MIN = 5;
const MAX = 120;

function LogControls({ onLog }) {
  const [minutes, setMinutes] = useState(10);

  function decrement() {
    setMinutes((m) => Math.max(MIN, m - STEP));
  }

  function increment() {
    setMinutes((m) => Math.min(MAX, m + STEP));
  }

  function handleLog() {
    onLog(minutes);
  }

  return (
    <div className="stepper">
      <div className="stepper-row">
        <button
          type="button"
          className="stepper-btn"
          onClick={decrement}
          disabled={minutes <= MIN}
          aria-label="Decrease minutes"
        >
          −
        </button>

        <div className="stepper-value">
          <span className="stepper-number">{minutes}</span>
          <span className="stepper-unit">min</span>
        </div>

        <button
          type="button"
          className="stepper-btn"
          onClick={increment}
          disabled={minutes >= MAX}
          aria-label="Increase minutes"
        >
          +
        </button>
      </div>

      <button className="btn btn-primary log-btn" onClick={handleLog}>
        Log {minutes} min
      </button>
    </div>
  );
}

export default LogControls;