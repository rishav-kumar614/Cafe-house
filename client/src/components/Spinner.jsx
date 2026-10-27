export function Spinner({ label = 'Loading', full = false }) {
  return (
    <div className={`spinner-wrap ${full ? 'full' : ''}`} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
