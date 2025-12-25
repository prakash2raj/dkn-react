import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function ChampionValidation({ onValidated, onSelectDocument }) {
  const [pending, setPending] = useState([]);
  const [status, setStatus] = useState({ message: "", tone: "neutral" });
  const [loading, setLoading] = useState(true);

  const loadPending = useCallback(() => {
    setStatus({ message: "", tone: "neutral" });
    setLoading(true);
    apiRequest("/api/documents/pending")
      .then(setPending)
      .catch(() =>
        setStatus({
          message: "Unable to load pending documents.",
          tone: "error",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const validateDoc = async (id) => {
    setStatus({ message: "", tone: "neutral" });
    try {
      await apiRequest(`/api/documents/${id}/validate`, "PUT");
      setPending((p) => p.filter((d) => d.id !== id));
      setStatus({ message: "Document validated successfully.", tone: "success" });
      if (typeof onValidated === "function") {
        onValidated();
      }
    } catch (err) {
      setStatus({
        message: "Unable to validate document right now.",
        tone: "error",
      });
    }
  };

  return (
    <div className="panel-body">
      {status.message && (
        <div className={`status-chip ${status.tone}`}>{status.message}</div>
      )}
      <div className="panel-controls">
        <button
          type="button"
          className="action-button"
          onClick={loadPending}
          disabled={loading}
        >
          Refresh queue
        </button>
      </div>
      {loading ? (
        <div className="muted">Loading pending documents...</div>
      ) : pending.length === 0 ? (
        <div className="empty-state">No pending documents.</div>
      ) : (
        <ul className="item-list">
          {pending.map((d) => (
            <li key={d.id} className="item">
              <div>
                <p className="item-title">{d.title}</p>
                <p className="item-subtitle">
                  {d.description || "Awaiting validation before publishing."}
                </p>
                <p className="item-subtitle">
                  {d.project?.name ? `Project: ${d.project.name}` : "No project"} •{" "}
                  {d.creator?.name ? `Owner: ${d.creator.name}` : "Unknown owner"}
                </p>
                <p className="item-subtitle">
                  {d.workspace?.name ? `Workspace: ${d.workspace.name}` : "No workspace"}
                </p>
              </div>
              <div className="item-tags">
                <span className="pill subtle">{d.confidentiality}</span>
                {d.tags?.length > 0 && (
                  <div className="tag-row">
                    {d.tags.map((tag) => (
                      <span key={tag.id} className="pill subtle small-pill">
                        {tag.name || tag.label}
                      </span>
                    ))}
                  </div>
                )}
                {typeof onSelectDocument === "function" && (
                  <button
                    className="action-button"
                    type="button"
                    onClick={() => onSelectDocument(d.id)}
                  >
                    View
                  </button>
                )}
                <button
                  className="action-button"
                  type="button"
                  onClick={() => validateDoc(d.id)}
                >
                  Validate
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
