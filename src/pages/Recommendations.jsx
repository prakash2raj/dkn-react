import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiRequest("/api/recommendations")
      .then(setRecs)
      .catch(() => setError("Unable to load recommendations right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel-body">
      {error && <div className="status-chip error">{error}</div>}
      {loading ? (
        <div className="muted">Loading recommendations...</div>
      ) : recs.length === 0 ? (
        <div className="empty-state">
          No recommendations yet. Upload more context or check back soon.
        </div>
      ) : (
        <ul className="item-list">
          {recs.map((r) => (
            <li key={r.id} className="item">
              <div>
                <p className="item-title">
                  {r.document?.title || `Document #${r.knowledge_document_id}`}
                </p>
                <p className="item-subtitle">
                  {r.document?.description ||
                    "Suggested follow-up based on recent activity."}
                </p>
              </div>
              <div className="item-tags">
                {r.type && <span className="pill subtle">{r.type}</span>}
                <span className="pill subtle">
                  {typeof r.score === "number" ? `Score ${r.score}` : "Recommendation"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
