import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { hasRole } from "../utils/auth";

export default function DocumentDetails({ documentId, onClose, user }) {
  const [detail, setDetail] = useState(null);
  const [policyRules, setPolicyRules] = useState([]);
  const [aiJobs, setAiJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [policyForm, setPolicyForm] = useState({ rule_type: "", description: "" });
  const [aiJobForm, setAiJobForm] = useState({ job_type: "", status: "" });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const canManageAddOns = hasRole(
    ["CHAMPION", "GOVERNANCE", "ADMIN"],
    user
  );

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      apiRequest(`/api/documents/${documentId}`),
      apiRequest(`/api/documents/${documentId}/policy-rules`),
      apiRequest(`/api/documents/${documentId}/ai-jobs`),
    ])
      .then(([doc, policies, jobs]) => {
        setDetail(doc);
        setPolicyRules(Array.isArray(policies) ? policies : []);
        setAiJobs(Array.isArray(jobs) ? jobs : []);
      })
      .catch(() => setError("Unable to load document details."))
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitPolicyRule = async (e) => {
    e.preventDefault();
    if (!policyForm.rule_type) return;
    setSavingPolicy(true);
    try {
      await apiRequest(`/api/documents/${documentId}/policy-rules`, "POST", {
        rule_type: policyForm.rule_type,
        description: policyForm.description || null,
      });
      setPolicyForm({ rule_type: "", description: "" });
      loadData();
    } catch (err) {
      setError(err?.data?.message || "Unable to add policy rule.");
    } finally {
      setSavingPolicy(false);
    }
  };

  const submitAiJob = async (e) => {
    e.preventDefault();
    if (!aiJobForm.job_type) return;
    setSavingJob(true);
    try {
      await apiRequest(`/api/documents/${documentId}/ai-jobs`, "POST", {
        job_type: aiJobForm.job_type,
        status: aiJobForm.status || null,
      });
      setAiJobForm({ job_type: "", status: "" });
      loadData();
    } catch (err) {
      setError(err?.data?.message || "Unable to add AI job.");
    } finally {
      setSavingJob(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Document detail</p>
            <h3>{detail?.title || "Document"}</h3>
          </div>
          <button className="action-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {error && <div className="status-chip error">{error}</div>}

        {loading ? (
          <div className="muted">Loading details...</div>
        ) : !detail ? (
          <div className="empty-state">Document not found.</div>
        ) : (
          <div className="modal-body">
            <div className="detail-row">
              <div>
                <p className="item-subtitle">
                  {detail.description || "No description provided."}
                </p>
                <p className="item-subtitle">
                  Status: {detail.status || "Unknown"} • Confidentiality:{" "}
                  {detail.confidentiality}
                </p>
                <p className="item-subtitle">
                  {detail.workspace?.name
                    ? `Workspace: ${detail.workspace.name}`
                    : "No workspace"}
                </p>
                <p className="item-subtitle">
                  Project: {detail.project?.name || "None"} • Owner:{" "}
                  {detail.creator?.name || "Unknown"}
                </p>
                {detail.tags?.length > 0 && (
                  <div className="tag-row">
                    {detail.tags.map((tag) => (
                      <span key={tag.id} className="pill subtle small-pill">
                        {tag.name || tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="item-tags">
                <span className="pill subtle">{detail.confidentiality}</span>
                <span className="pill subtle">{detail.status}</span>
              </div>
            </div>

            <div className="split-grid">
              <div>
                <div className="panel-header" style={{ padding: 0 }}>
                  <p className="eyebrow">Policy rules</p>
                  <span className="pill subtle">{policyRules.length}</span>
                </div>
                {policyRules.length === 0 ? (
                  <div className="empty-state">No policy rules yet.</div>
                ) : (
                  <ul className="item-list">
                    {policyRules.map((rule) => (
                      <li key={rule.id} className="item">
                        <div>
                          <p className="item-title">
                            {rule.rule_type || rule.title || rule.name}
                          </p>
                          <p className="item-subtitle">
                            {rule.description || "No description"}
                          </p>
                        </div>
                        {rule.status && (
                          <span className="pill subtle">{rule.status}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canManageAddOns && (
                  <form className="form-grid" onSubmit={submitPolicyRule}>
                    <label className="field">
                      <span>Policy rule type</span>
                      <input
                        className="input"
                        value={policyForm.rule_type}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({ ...prev, rule_type: e.target.value }))
                        }
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Description</span>
                      <textarea
                        className="textarea"
                        rows={3}
                        value={policyForm.description}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="form-actions">
                      <button className="primary-button" type="submit" disabled={savingPolicy}>
                        {savingPolicy ? "Saving..." : "Add policy rule"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div>
                <div className="panel-header" style={{ padding: 0 }}>
                  <p className="eyebrow">AI jobs</p>
                  <span className="pill subtle">{aiJobs.length}</span>
                </div>
                {aiJobs.length === 0 ? (
                  <div className="empty-state">No AI jobs yet.</div>
                ) : (
                  <ul className="item-list">
                    {aiJobs.map((job) => (
                      <li key={job.id} className="item">
                        <div>
                          <p className="item-title">{job.type || job.job_type || "Job"}</p>
                          <p className="item-subtitle">
                            {job.status ? `Status: ${job.status}` : "No status provided"}
                          </p>
                        </div>
                        {job.created_at && (
                          <span className="pill subtle">
                            {new Date(job.created_at).toLocaleString()}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canManageAddOns && (
                  <form className="form-grid" onSubmit={submitAiJob}>
                    <label className="field">
                      <span>AI job type</span>
                      <input
                        className="input"
                        value={aiJobForm.job_type}
                        onChange={(e) =>
                          setAiJobForm((prev) => ({
                            ...prev,
                            job_type: e.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Status (optional)</span>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={aiJobForm.status}
                        onChange={(e) =>
                          setAiJobForm((prev) => ({ ...prev, status: e.target.value }))
                        }
                        placeholder="pending / in_progress / done"
                      />
                    </label>
                    <div className="form-actions">
                      <button className="primary-button" type="submit" disabled={savingJob}>
                        {savingJob ? "Saving..." : "Create AI job"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
