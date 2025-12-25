import { useState } from "react";
import { apiRequest } from "../api";

export default function UploadKnowledge({
  projects = [],
  workspaces = [],
  tags = [],
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [confidentiality, setConfidentiality] = useState("INTERNAL");
  const [projectId, setProjectId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [status, setStatus] = useState({ message: "", tone: "neutral" });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleTag = (id) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title.trim()) {
      nextErrors.title = "Title is required before upload.";
    }
    if (!confidentiality) {
      nextErrors.confidentiality = "Select a confidentiality level.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({
        message: "Please fix the highlighted fields before submitting.",
        tone: "error",
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    setStatus({ message: "", tone: "neutral" });
    try {
      await apiRequest("/api/documents", "POST", {
        title,
        description: description || null,
        confidentiality,
        project_id: projectId || null,
        workspace_id: workspaceId || null,
        tag_ids: selectedTags,
      });
      setStatus({
        message: "Document uploaded for validation.",
        tone: "success",
      });
      setTitle("");
      setDescription("");
      setProjectId("");
      setWorkspaceId("");
      setSelectedTags([]);
      setConfidentiality("INTERNAL");
      if (typeof onCreated === "function") {
        onCreated();
      }
    } catch (err) {
      const message =
        err?.data?.message || "Error uploading document. Please try again.";
      setStatus({ message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel-body">
      {status.message && (
        <div className={`status-chip ${status.tone}`}>{status.message}</div>
      )}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title</span>
          <input
            className="input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: "" }));
              }
            }}
            placeholder="What should we call this document?"
            required
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context so reviewers can validate faster."
            rows={4}
          />
        </label>
        <label className="field">
          <span>Confidentiality</span>
          <select
            className="input"
            value={confidentiality}
            onChange={(e) => {
              setConfidentiality(e.target.value);
              if (errors.confidentiality) {
                setErrors((prev) => ({ ...prev, confidentiality: "" }));
              }
            }}
          >
            <option value="PUBLIC">Public</option>
            <option value="INTERNAL">Internal</option>
            <option value="RESTRICTED">Restricted</option>
          </select>
          {errors.confidentiality && (
            <p className="field-error">{errors.confidentiality}</p>
          )}
        </label>
        <label className="field">
          <span>Project (optional)</span>
          <select
            className="input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project selected</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Workspace (optional)</span>
          <select
            className="input"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          >
            <option value="">No workspace selected</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.visibility ? `• ${w.visibility}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Tags</span>
          <div className="tag-grid">
            {tags.length === 0 ? (
              <p className="muted">No tags available yet.</p>
            ) : (
              tags.map((tag) => (
                <label key={tag.id} className="tag-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  <span>{tag.name || tag.label || `Tag ${tag.id}`}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Uploading..." : "Upload for validation"}
          </button>
        </div>
      </form>
    </div>
  );
}
