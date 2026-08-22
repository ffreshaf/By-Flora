function PassportStamp({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="passport-stamp" aria-hidden="true">
      <span className="stamp-initial">{initial}</span>
      <span className="stamp-ring" />
    </div>
  );
}

export default PassportStamp;