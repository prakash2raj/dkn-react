import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import { hasRole } from "../utils/auth";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_VALIDATION", label: "Pending validation" },
  { value: "VALIDATED", label: "Validated" },
  { value: "ARCHIVED", label: "Archived" },
];

const CONFIDENTIALITY_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "RESTRICTED", label: "Restricted" },
];

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status
    .toString()
    .split("_")
    .map((piece) => piece[0]?.toUpperCase() + piece.slice(1).toLowerCase())
    .join(" ");
};

export default function DocumentDetails({ documentId, onClose, user }) {
  const [detail, setDetail] = useState(null);
  const [policyRules, setPolicyRules] = useState([]);
  const [aiJobs, setAiJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState({
    projects: true,
    workspaces: true,
    tags: true,
  });
  const [error, setError] = useState("");
  const [metadataError, setMetadataError] = useState("");
  const [policyForm, setPolicyForm] = useState({ rule_type: "", description: "" });
  const [aiJobForm, setAiJobForm] = useState({ job_type: "", status: "" });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    confidentiality: "INTERNAL",
    project_id: "",
    workspace_id: "",
    tag_ids: [],
    status: "",
  });
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [actionStatus, setActionStatus] = useState({ message: "", tone: "neutral" });
  const [deleting, setDeleting] = useState(false);

  const canManageAddOns = hasRole(["CHAMPION", "GOVERNANCE", "ADMIN"], user);

  const normalizedStatus = useMemo(
    () => (detail?.status ? detail.status.toUpperCase() : ""),
    [detail?.status]
  );
  const isLockedStatus = useMemo(
    () => ["VALIDATED", "ARCHIVED"].includes(normalizedStatus),
    [normalizedStatus]
  );
  const isOwner = useMemo(
    () =>
      Boolean(
        detail?.creator?.id &&
          user?.id &&
          String(detail.creator.id) === String(user.id)
      ),
    [detail?.creator?.id, user?.id]
  );
  const canGovern = useMemo(
    () => hasRole(["CHAMPION", "GOVERNANCE", "ADMIN"], user),
    [user]
  );
  const canEdit = useMemo(
    () => canGovern || (isOwner && !isLockedStatus),
    [canGovern, isOwner, isLockedStatus]
  );
  const availableStatusOptions = useMemo(
    () =>
      canGovern
        ? STATUS_OPTIONS
        : STATUS_OPTIONS.filter(
            (opt) => opt.value !== "VALIDATED" && opt.value !== "ARCHIVED"
          ),
    [canGovern]
  );

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    setValidationErrors({});
    setActionStatus({ message: "", tone: "neutral" });
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
      .catch((err) => {
        const message =
          err?.status === 403
            ? err?.data?.message || "You do not have access to this document."
            : err?.data?.message || "Unable to load document details.";
        setDetail(null);
        setPolicyRules([]);
        setAiJobs([]);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  const loadMetadata = useCallback(async () => {
    setMetadataError("");
    setMetadataLoading({ projects: true, workspaces: true, tags: true });
    try {
      const [projectsRes, workspacesRes, tagsRes] = await Promise.all([
        apiRequest("/api/projects").catch(() => []),
        apiRequest("/api/workspaces").catch(() => []),
        apiRequest("/api/tags").catch(() => []),
      ]);
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setWorkspaces(Array.isArray(workspacesRes) ? workspacesRes : []);
      setTags(Array.isArray(tagsRes) ? tagsRes : []);
    } catch {
      setMetadataError("Unable to load projects, workspaces, or tags.");
    } finally {
      setMetadataLoading({ projects: false, workspaces: false, tags: false });
    }
  }, []);

  useEffect(() => {
    loadData();
    loadMetadata();
  }, [loadData, loadMetadata]);

  useEffect(() => {
    if (!detail) return;
    setEditForm({
      title: detail.title || "",
      description: detail.description || "",
      confidentiality: detail.confidentiality || "INTERNAL",
      project_id: detail.project?.id ? String(detail.project.id) : "",
      workspace_id: detail.workspace?.id ? String(detail.workspace.id) : "",
      tag_ids: Array.isArray(detail.tags) ? detail.tags.map((t) => t.id) : [],
      status: "",
    });
  }, [detail]);

  const toggleTag = (id) => {
    setEditForm((prev) => {
      const exists = prev.tag_ids.includes(id);
      return {
        ...prev,
        tag_ids: exists ? prev.tag_ids.filter((t) => t !== id) : [...prev.tag_ids, id],
      };
    });
  };

  const renderFieldError = (field) => {
    const fieldError = validationErrors?.[field];
    if (!fieldError) return null;
    const message = Array.isArray(fieldError) ? fieldError.join(" ") : fieldError;
    return <p className="field-error">{message}</p>;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!detail) return;
    setValidationErrors({});
    setActionStatus({ message: "", tone: "neutral" });

    if (!editForm.title.trim()) {
      setValidationErrors({ title: "Title is required." });
      setActionStatus({
        message: "Please add a title before saving.",
        tone: "error",
      });
      return;
    }

    if (!editForm.confidentiality) {
      setValidationErrors({ confidentiality: "Confidentiality is required." });
      setActionStatus({
        message: "Select a confidentiality level before saving.",
        tone: "error",
      });
      return;
    }

    const payload = {
      title: editForm.title.trim(),
      description: editForm.description?.trim() || null,
      confidentiality: editForm.confidentiality,
      project_id: editForm.project_id || null,
      workspace_id: editForm.workspace_id || null,
      tag_ids: editForm.tag_ids,
    };

    if (editForm.status) {
      payload.status = editForm.status;
    }

    setSavingUpdate(true);
    try {
      await apiRequest(`/api/documents/${documentId}`, "PUT", payload);
      setActionStatus({
        message: "Document updated successfully.",
        tone: "success",
      });
      setEditForm((prev) => ({ ...prev, status: "" }));
      loadData();
    } catch (err) {
      const message =
        err?.data?.message ||
        (err?.status === 403
          ? "You do not have permission to update this document."
          : "Unable to update document. Please review and try again.");
      setActionStatus({ message, tone: "error" });
      if (err?.status === 422 && err?.data?.errors) {
        setValidationErrors(err.data.errors);
      }
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    const confirmed = window.confirm(
      "Delete this document? This action cannot be undone."
    );
    if (!confirmed) return;

    setActionStatus({ message: "", tone: "neutral" });
    setDeleting(true);
    try {
      await apiRequest(`/api/documents/${documentId}`, "DELETE");
      setActionStatus({ message: "Document deleted.", tone: "success" });
      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      const message =
        err?.data?.message ||
        (err?.status === 403
          ? "You do not have permission to delete this document."
          : "Unable to delete document right now.");
      setActionStatus({ message, tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

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

        {actionStatus.message && (
          <div className={`status-chip ${actionStatus.tone}`}>{actionStatus.message}</div>
        )}

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
                  Status: {formatStatus(detail.status)} • Confidentiality:{" "}
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
                <span className="pill subtle">{formatStatus(detail.status)}</span>
              </div>
            </div>

            <div className="panel-header" style={{ padding: 0, marginTop: "0.5rem" }}>
              <p className="eyebrow">Update document</p>
              <span className="pill subtle">{canEdit ? "Editable" : "Read only"}</span>
            </div>

            {!canEdit && (
              <div className="status-chip">
                Validated or archived documents can only be edited by champions, governance,
                or admins. Other users can edit their own drafts and pending submissions.
              </div>
            )}

            {metadataError && <div className="status-chip error">{metadataError}</div>}

            <form className="form-grid" onSubmit={handleUpdate}>
              <label className="field">
                <span>Title</span>
                <input
                  className="input"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  disabled={!canEdit || savingUpdate}
                />
                {renderFieldError("title")}
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  className="textarea"
                  rows={4}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  disabled={!canEdit || savingUpdate}
                />
                {renderFieldError("description")}
              </label>

              <label className="field">
                <span>Confidentiality</span>
                <select
                  className="input"
                  value={editForm.confidentiality}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, confidentiality: e.target.value }))
                  }
                  disabled={!canEdit || savingUpdate}
                >
                  {CONFIDENTIALITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {renderFieldError("confidentiality")}
              </label>

              <label className="field">
                <span>Project (optional)</span>
                {metadataLoading.projects ? (
                  <p className="muted">Loading projects...</p>
                ) : (
                  <select
                    className="input"
                    value={editForm.project_id}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, project_id: e.target.value }))
                    }
                    disabled={!canEdit || savingUpdate}
                  >
                    <option value="">No project selected</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                )}
                {renderFieldError("project_id")}
              </label>

              <label className="field">
                <span>Workspace (optional)</span>
                {metadataLoading.workspaces ? (
                  <p className="muted">Loading workspaces...</p>
                ) : (
                  <select
                    className="input"
                    value={editForm.workspace_id}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, workspace_id: e.target.value }))
                    }
                    disabled={!canEdit || savingUpdate}
                  >
                    <option value="">No workspace selected</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}{" "}
                        {workspace.visibility ? `• ${workspace.visibility}` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {renderFieldError("workspace_id")}
              </label>

              <div className="field">
                <span>Tags</span>
                {metadataLoading.tags ? (
                  <p className="muted">Loading tags...</p>
                ) : tags.length === 0 ? (
                  <p className="muted">No tags available.</p>
                ) : (
                  <div className="tag-row" style={{ flexWrap: "wrap" }}>
                    {tags.map((tag) => (
                      <label key={tag.id} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={editForm.tag_ids.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          disabled={!canEdit || savingUpdate}
                        />
                        <span>{tag.name || tag.label || `Tag ${tag.id}`}</span>
                      </label>
                    ))}
                  </div>
                )}
                {renderFieldError("tag_ids")}
                <p className="muted">Send an empty list to clear all tags.</p>
              </div>

              <label className="field">
                <span>Status (optional)</span>
                <select
                  className="input"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  disabled={!canEdit || savingUpdate}
                >
                  <option value="">
                    Keep current ({formatStatus(detail.status || "PENDING_VALIDATION")})
                  </option>
                  {availableStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {renderFieldError("status")}
                <p className="muted">
                  Leave blank to keep the current lifecycle. Governance roles can move items
                  to validated or archived.
                </p>
              </label>

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!canEdit || savingUpdate}
                >
                  {savingUpdate ? "Saving..." : "Save changes"}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleDelete}
                  disabled={!canEdit || deleting}
                >
                  {deleting ? "Deleting..." : "Delete document"}
                </button>
              </div>
            </form>

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
