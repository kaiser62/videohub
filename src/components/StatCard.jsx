export default function StatCard({ label, value, status, icon: Icon, subtext }) {
  const getStatusClass = () => {
    if (status === 'ok') return 'status-ok';
    if (status === 'warning') return 'status-warning';
    if (status === 'error') return 'status-error';
    return '';
  };

  return (
    <div className={`stat-card ${getStatusClass()}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={18} className="stat-icon" />}
      </div>
      <div className="stat-value tnum">{value ?? '—'}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
      {status && (
        <div className="stat-status-badge">
          <span className={`status-dot ${status}`} />
          <span className="status-label">{status.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
