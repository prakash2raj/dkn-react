import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function AdminUserDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiRequest("/api/admin/users")
      .then(setUsers)
      .catch(() => setError("Unable to load users right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel-body">
      {error && <div className="status-chip error">{error}</div>}
      {loading ? (
        <div className="muted">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <ul className="item-list">
          {users.map((u) => (
            <li key={u.id} className="item">
              <div>
                <p className="item-title">{u.name}</p>
                <p className="item-subtitle">{u.email}</p>
              </div>
              <div className="item-tags">
                <span className="pill subtle">
                  {u.role?.role_name || u.role || "Unknown role"}
                </span>
                {u.office?.name && <span className="pill subtle">{u.office.name}</span>}
                {u.region && <span className="pill subtle">{u.region}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
