function CareRing({ name, photo, progress = 0 }) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;

  const circumference = 2 * Math.PI * radius;

  const clamped = Math.min(Math.max(progress, 0), 1);

  const offset = circumference * (1 - clamped);

  const initial =
    name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="care-ring-wrap">
      <svg
        className="care-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--sage)"
          strokeWidth={stroke}
          opacity="0.25"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
      </svg>

      <div className="care-ring-content">
        {photo ? (
          <img
            src={photo}
            alt={name || 'Dog'}
            className="care-ring-photo"
          />
        ) : (
          <span className="care-ring-initial">
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}

export default CareRing;