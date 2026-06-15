export default function StatCard({ label, value, status: statusType }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${statusType ? ` stat-${statusType}` : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}
