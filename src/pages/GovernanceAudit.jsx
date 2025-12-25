import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function GovernanceAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiRequest("/api/audit-logs")
      .then(setLogs)
      .catch(() => setError("Unable to load audit logs right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel-body">
      {error && <div className="status-chip error">{error}</div>}
      {loading ? (
        <div className="muted">Loading audit entries...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">No audit entries found.</div>
      ) : (
        <ul className="item-list">
          {logs.map((log) => (
            <li key={log.id} className="item">
              <div>
                <p className="item-title">{log.action}</p>
                <p className="item-subtitle">
                  {log.entity_type} #{log.entity_id}
                </p>
                {log.action_type && (
                  <p className="item-subtitle">Action type: {log.action_type}</p>
                )}
                <p className="item-subtitle">
                  {log.actor?.name ? `By ${log.actor.name}` : "Unknown actor"}{" "}
                  {log.created_at ? `• ${new Date(log.created_at).toLocaleString()}` : ""}
                </p>
              </div>
              <span className="pill subtle">Audit</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
