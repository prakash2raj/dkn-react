import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import UploadKnowledge from "./UploadKnowledge";
import Recommendations from "./Recommendations";
import { getUser, hasRole } from "../utils/auth";
import ChampionValidation from "./ChampionValidation";
import GovernanceAudit from "./GovernanceAudit";
import AdminUserDirectory from "./AdminUserDirectory";
import DocumentDetails from "./DocumentDetails";
import "./Dashboard.css";

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
};

export default function Dashboard({ user: userProp, onLogout }) {
  const user = useMemo(() => userProp || getUser(), [userProp]);
  const [docs, setDocs] = useState([]);
  const [myDocs, setMyDocs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [tags, setTags] = useState([]);
  const [offices, setOffices] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [expertise, setExpertise] = useState(null);
  const [expertiseForm, setExpertiseForm] = useState({
    skills: "",
    experience_level: "",
  });
  const [projectsFilterActive, setProjectsFilterActive] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeView, setActiveView] = useState("knowledge");
  const [loading, setLoading] = useState({
    docs: true,
    myDocs: true,
    projects: true,
    workspaces: true,
    tags: true,
    offices: true,
    constraints: true,
    leaderboard: true,
    gamification: true,
    expertise: true,
  });
  const [statusMessages, setStatusMessages] = useState({
    tag: "",
    expertise: "",
  });
  const [newTag, setNewTag] = useState("");
  const [savingExpertise, setSavingExpertise] = useState(false);

  const loadDocs = useCallback(() => {
    setLoading((prev) => ({ ...prev, docs: true }));
    apiRequest("/api/documents")
      .then(setDocs)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, docs: false })));
  }, []);

  const loadMyDocs = useCallback(() => {
    setLoading((prev) => ({ ...prev, myDocs: true }));
    apiRequest("/api/documents/mine")
      .then(setMyDocs)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, myDocs: false })));
  }, []);

  const loadProjects = useCallback(
    (activeOnly = projectsFilterActive) => {
      setLoading((prev) => ({ ...prev, projects: true }));
      apiRequest(`/api/projects?active_only=${activeOnly}`)
        .then(setProjects)
        .catch(console.error)
        .finally(() => setLoading((prev) => ({ ...prev, projects: false })));
    },
    [projectsFilterActive]
  );

  const loadWorkspaces = useCallback(() => {
    setLoading((prev) => ({ ...prev, workspaces: true }));
    apiRequest("/api/workspaces")
      .then(setWorkspaces)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, workspaces: false })));
  }, []);

  const loadTags = useCallback(() => {
    setLoading((prev) => ({ ...prev, tags: true }));
    apiRequest("/api/tags")
      .then(setTags)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, tags: false })));
  }, []);

  const loadOffices = useCallback(() => {
    setLoading((prev) => ({ ...prev, offices: true }));
    apiRequest("/api/offices")
      .then(setOffices)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, offices: false })));
  }, []);

  const loadConstraints = useCallback(() => {
    setLoading((prev) => ({ ...prev, constraints: true }));
    apiRequest("/api/regulatory-constraints")
      .then(setConstraints)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, constraints: false })));
  }, []);

  const loadLeaderboard = useCallback(() => {
    setLoading((prev) => ({ ...prev, leaderboard: true }));
    apiRequest("/api/leaderboard")
      .then(setLeaderboard)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, leaderboard: false })));
  }, []);

  const loadGamification = useCallback(() => {
    setLoading((prev) => ({ ...prev, gamification: true }));
    apiRequest("/api/gamification")
      .then(setGamification)
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, gamification: false })));
  }, []);

  const loadExpertise = useCallback(() => {
    setLoading((prev) => ({ ...prev, expertise: true }));
    apiRequest("/api/expertise-profile")
      .then((data) => {
        setExpertise(data);
        setExpertiseForm({
          skills: data?.skills || "",
          experience_level: data?.experience_level || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading((prev) => ({ ...prev, expertise: false })));
  }, []);

  useEffect(() => {
    loadDocs();
    loadMyDocs();
    loadProjects(projectsFilterActive);
    loadWorkspaces();
    loadTags();
    loadOffices();
    loadConstraints();
    loadLeaderboard();
    loadGamification();
    loadExpertise();
  }, [
    loadDocs,
    loadMyDocs,
    loadProjects,
    projectsFilterActive,
    loadWorkspaces,
    loadTags,
    loadOffices,
    loadConstraints,
    loadLeaderboard,
    loadGamification,
    loadExpertise,
  ]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [user]);

  const canUpload = hasRole(
    ["CONSULTANT", "CHAMPION", "EXECUTIVE", "ADMIN", "GOVERNANCE"],
    user
  );

  const isAdmin = hasRole(["ADMIN"], user);

  const navItems = useMemo(
    () =>
      [
        { key: "upload", label: "Upload", visible: canUpload },
        { key: "knowledge", label: "Knowledge base", visible: true },
        { key: "myDocs", label: "My documents", visible: true },
        { key: "projects", label: "Projects", visible: true },
        { key: "metadata", label: "Workspaces & tags", visible: true },
        { key: "constraints", label: "Offices & constraints", visible: true },
        {
          key: "validation",
          label: "Validation queue",
          visible: hasRole(["CHAMPION", "GOVERNANCE"], user),
        },
        {
          key: "audit",
          label: "Audit logs",
          visible: hasRole(["GOVERNANCE"], user),
        },
        { key: "expertise", label: "Expertise profile", visible: true },
        { key: "gamification", label: "Gamification", visible: true },
        { key: "admin", label: "Admin users", visible: isAdmin },
        { key: "recommendations", label: "Recommendations", visible: true },
      ].filter((item) => item.visible),
    [canUpload, isAdmin, user]
  );

  useEffect(() => {
    const first = navItems[0]?.key;
    if (first && !navItems.find((n) => n.key === activeView)) {
      setActiveView(first);
    }
  }, [navItems, activeView]);

  const handleDocumentCreated = () => {
    loadDocs();
    loadMyDocs();
  };

  const handleValidated = () => {
    loadDocs();
    loadMyDocs();
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    setStatusMessages((prev) => ({ ...prev, tag: "" }));
    try {
      await apiRequest("/api/tags", "POST", { tag_name: newTag.trim() });
      setNewTag("");
      setStatusMessages((prev) => ({
        ...prev,
        tag: "Tag created.",
      }));
      loadTags();
    } catch (err) {
      setStatusMessages((prev) => ({
        ...prev,
        tag: err?.data?.message || "Unable to create tag.",
      }));
    }
  };

  const handleExpertiseSave = async (e) => {
    e.preventDefault();
    setSavingExpertise(true);
    setStatusMessages((prev) => ({ ...prev, expertise: "" }));
    try {
      await apiRequest("/api/expertise-profile", "PUT", {
        skills: expertiseForm.skills || null,
        experience_level: expertiseForm.experience_level || null,
      });
      setStatusMessages((prev) => ({
        ...prev,
        expertise: "Profile updated.",
      }));
      loadExpertise();
    } catch (err) {
      setStatusMessages((prev) => ({
        ...prev,
        expertise: err?.data?.message || "Unable to update expertise.",
      }));
    } finally {
      setSavingExpertise(false);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "upload":
        return (
          <section className="panel panel-wide">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Upload knowledge</p>
                <h3>Submit new evidence for validation</h3>
              </div>
              <span className="pill">Secure upload</span>
            </div>
            <UploadKnowledge
              projects={projects}
              workspaces={workspaces}
              tags={tags}
              onCreated={handleDocumentCreated}
            />
          </section>
        );
      case "knowledge":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Validated knowledge</p>
                <h3>Knowledge base</h3>
              </div>
              <div className="count-badge">{docs.length}</div>
            </div>
            <div className="panel-body">
              {loading.docs ? (
                <div className="muted">Loading validated documents...</div>
              ) : docs.length === 0 ? (
                <div className="empty-state">
                  No validated documents yet. Upload context to get started.
                </div>
              ) : (
                <ul className="item-list">
                  {docs.map((d) => (
                    <li key={d.id} className="item">
                      <div>
                        <p className="item-title">{d.title}</p>
                        <p className="item-subtitle">
                          {d.description || "No description provided."}
                        </p>
                        <p className="item-subtitle">
                          {d.project?.name ? `Project: ${d.project.name}` : "No project"}{" "}
                          • {d.creator?.name ? `Owner: ${d.creator.name}` : "Owner unknown"}
                        </p>
                        <p className="item-subtitle">
                          {d.workspace?.name
                            ? `Workspace: ${d.workspace.name}`
                            : "No workspace"}{" "}
                          {d.tags?.length ? "• Tags:" : ""}
                          {d.tags?.length
                            ? d.tags.map((t) => t.name || t.label).join(", ")
                            : ""}
                        </p>
                      </div>
                      <div className="item-tags">
                        <span className="pill subtle">Validated</span>
                        {d.confidentiality && (
                          <span className="pill subtle">{d.confidentiality}</span>
                        )}
                        <button
                          className="action-button"
                          type="button"
                          onClick={() => setSelectedDocId(d.id)}
                        >
                          View
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      case "myDocs":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">My submissions</p>
                <h3>Track document status</h3>
              </div>
              <span className="pill subtle">Owner view</span>
            </div>
            <div className="panel-body">
              {loading.myDocs ? (
                <div className="muted">Loading your documents...</div>
              ) : myDocs.length === 0 ? (
                <div className="empty-state">
                  You have not uploaded any documents yet.
                </div>
              ) : (
                <ul className="item-list">
                  {myDocs.map((d) => (
                    <li key={d.id} className="item">
                      <div>
                        <p className="item-title">{d.title}</p>
                        <p className="item-subtitle">
                          {d.description || "No description provided."}
                        </p>
                        <p className="item-subtitle">
                          {d.project?.name || "No project"} •{" "}
                          {d.confidentiality || "Unspecified confidentiality"}
                        </p>
                        <p className="item-subtitle">
                          {d.workspace?.name
                            ? `Workspace: ${d.workspace.name}`
                            : "No workspace"}{" "}
                          {d.tags?.length ? "• Tags:" : ""}
                          {d.tags?.length
                            ? d.tags.map((t) => t.name || t.label).join(", ")
                            : ""}
                        </p>
                      </div>
                      <div className="item-tags">
                        <span className="pill subtle">
                          {formatStatus(d.status || "PENDING_VALIDATION")}
                        </span>
                        <button
                          className="action-button"
                          type="button"
                          onClick={() => setSelectedDocId(d.id)}
                        >
                          View
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      case "projects":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Projects</p>
                <h3>Delivery tracks</h3>
              </div>
              <span className="pill subtle">
                {projectsFilterActive ? "Active only" : "All projects"}
              </span>
            </div>
            <div className="panel-body">
              <div className="panel-controls">
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    const next = !projectsFilterActive;
                    setProjectsFilterActive(next);
                  }}
                >
                  {projectsFilterActive ? "Show all projects" : "Show active only"}
                </button>
              </div>
              {loading.projects ? (
                <div className="muted">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="empty-state">No projects found for this filter.</div>
              ) : (
                <ul className="item-list">
                  {projects.map((project) => (
                    <li key={project.id} className="item">
                      <div>
                        <p className="item-title">{project.name}</p>
                        <p className="item-subtitle">
                          {project.description || "No project description."}
                        </p>
                      </div>
                      <div className="item-tags">
                        <span className="pill subtle">
                          {project.active ?? project.is_active ? "Active" : "Inactive"}
                        </span>
                        {project.region && (
                          <span className="pill subtle">{project.region}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      case "metadata":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Workspaces & tags</p>
                <h3>Organize knowledge</h3>
              </div>
              <span className="pill subtle">Metadata</span>
            </div>
            <div className="panel-body split-grid">
              <div>
                <p className="eyebrow">Workspaces</p>
                {loading.workspaces ? (
                  <div className="muted">Loading workspaces...</div>
                ) : workspaces.length === 0 ? (
                  <div className="empty-state">No workspaces found.</div>
                ) : (
                  <ul className="item-list">
                    {workspaces.map((w) => (
                      <li key={w.id} className="item">
                        <div>
                          <p className="item-title">{w.name}</p>
                          <p className="item-subtitle">
                            {w.visibility ? `Visibility: ${w.visibility}` : "No visibility"}
                          </p>
                        </div>
                        {w.region && <span className="pill subtle">{w.region}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="panel-header" style={{ padding: 0 }}>
                  <p className="eyebrow">Tags</p>
                  <div className="pill subtle">{tags.length} tags</div>
                </div>
                {loading.tags ? (
                  <div className="muted">Loading tags...</div>
                ) : (
                  <div className="tag-grid">
                    {tags.length === 0 ? (
                      <div className="empty-state">No tags yet.</div>
                    ) : (
                      tags.map((tag) => (
                        <span key={tag.id} className="pill subtle">
                          {tag.name || tag.label || `Tag ${tag.id}`}
                        </span>
                      ))
                    )}
                  </div>
                )}
                {isAdmin && (
                  <form className="tag-create" onSubmit={handleCreateTag}>
                    <input
                      className="input"
                      placeholder="Add tag (admin only)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                    />
                    <button className="action-button" type="submit">
                      Create
                    </button>
                  </form>
                )}
                {statusMessages.tag && (
                  <p className="muted" style={{ marginTop: "0.4rem" }}>
                    {statusMessages.tag}
                  </p>
                )}
              </div>
            </div>
          </section>
        );
      case "constraints":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Offices & constraints</p>
                <h3>Regulatory & network</h3>
              </div>
              <span className="pill subtle">Context</span>
            </div>
            <div className="panel-body split-grid">
              <div>
                <p className="eyebrow">Offices</p>
                {loading.offices ? (
                  <div className="muted">Loading offices...</div>
                ) : offices.length === 0 ? (
                  <div className="empty-state">No offices available.</div>
                ) : (
                  <ul className="item-list">
                    {offices.map((o) => (
                      <li key={o.id} className="item">
                        <div>
                          <p className="item-title">{o.name || `Office ${o.id}`}</p>
                          <p className="item-subtitle">
                            {o.city || o.region || "No region"}{" "}
                            {o.network_status ? `• ${o.network_status}` : ""}
                          </p>
                        </div>
                        {o.region && <span className="pill subtle">{o.region}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="eyebrow">Regulatory constraints</p>
                {loading.constraints ? (
                  <div className="muted">Loading constraints...</div>
                ) : constraints.length === 0 ? (
                  <div className="empty-state">No constraints listed.</div>
                ) : (
                  <ul className="item-list">
                    {constraints.map((c) => (
                      <li key={c.id} className="item">
                        <div>
                          <p className="item-title">{c.title || c.name}</p>
                          <p className="item-subtitle">
                            {c.description || c.notes || "No description provided."}
                          </p>
                        </div>
                        {c.region && <span className="pill subtle">{c.region}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      case "validation":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Validation queue</p>
                <h3>Champion & Governance</h3>
              </div>
              <span className="pill subtle">Queue</span>
            </div>
            <ChampionValidation
              onValidated={handleValidated}
              onSelectDocument={setSelectedDocId}
            />
          </section>
        );
      case "audit":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Governance panel</p>
                <h3>Audit logs</h3>
              </div>
              <span className="pill subtle">Oversight</span>
            </div>
            <GovernanceAudit />
          </section>
        );
      case "expertise":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Expertise profile</p>
                <h3>Skills & experience</h3>
              </div>
              <span className="pill subtle">Profile</span>
            </div>
            <div className="panel-body">
              {loading.expertise ? (
                <div className="muted">Loading your expertise profile...</div>
              ) : (
                <form className="form-grid" onSubmit={handleExpertiseSave}>
                  <label className="field">
                    <span>Skills</span>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={expertiseForm.skills}
                      onChange={(e) =>
                        setExpertiseForm((prev) => ({ ...prev, skills: e.target.value }))
                      }
                      placeholder="List skills relevant to your role"
                    />
                  </label>
                  <label className="field">
                    <span>Experience level</span>
                    <input
                      className="input"
                      value={expertiseForm.experience_level}
                      onChange={(e) =>
                        setExpertiseForm((prev) => ({
                          ...prev,
                          experience_level: e.target.value,
                        }))
                      }
                      placeholder="e.g., Senior, Intermediate"
                    />
                  </label>
                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={savingExpertise}>
                      {savingExpertise ? "Saving..." : "Save profile"}
                    </button>
                  </div>
                  {statusMessages.expertise && (
                    <p className="muted">{statusMessages.expertise}</p>
                  )}
                  {expertise?.updated_at && (
                    <p className="muted">
                      Last updated: {new Date(expertise.updated_at).toLocaleString()}
                    </p>
                  )}
                </form>
              )}
            </div>
          </section>
        );
      case "gamification":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Gamification</p>
                <h3>Progress & leaderboard</h3>
              </div>
              <span className="pill subtle">Engagement</span>
            </div>
            <div className="panel-body split-grid">
              <div>
                <p className="eyebrow">Your score</p>
                {loading.gamification ? (
                  <div className="muted">Loading score...</div>
                ) : gamification ? (
                  <ul className="item-list">
                    <li className="item">
                      <div>
                        <p className="item-title">{gamification.points} pts</p>
                        <p className="item-subtitle">
                          Badges:{" "}
                          {Array.isArray(gamification.badges)
                            ? gamification.badges.join(", ")
                            : gamification.badges || "None"}
                        </p>
                      </div>
                      {gamification.rank && (
                        <span className="pill subtle">Rank {gamification.rank}</span>
                      )}
                    </li>
                  </ul>
                ) : (
                  <div className="empty-state">No gamification data.</div>
                )}
              </div>
              <div>
                <p className="eyebrow">Leaderboard</p>
                {loading.leaderboard ? (
                  <div className="muted">Loading leaderboard...</div>
                ) : leaderboard.length === 0 ? (
                  <div className="empty-state">No leaderboard entries.</div>
                ) : (
                  <ul className="item-list">
                    {leaderboard.map((entry) => (
                      <li key={entry.id} className="item">
                        <div>
                          <p className="item-title">
                            #{entry.rank || entry.position} {entry.user?.name || entry.name}
                          </p>
                          <p className="item-subtitle">
                            Period: {entry.period || "N/A"} • Points: {entry.points || 0}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      case "admin":
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Admin panel</p>
                <h3>User directory</h3>
              </div>
              <span className="pill subtle">Admin</span>
            </div>
            <AdminUserDirectory />
          </section>
        );
      case "recommendations":
      default:
        return (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Recommendations</p>
                <h3>Next best actions</h3>
              </div>
              <span className="pill">AI-curated</span>
            </div>
            <Recommendations />
          </section>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome back, {user.name}</h1>
          <p className="muted">
            Role-aware workspace to upload context, validate knowledge, and
            monitor recommendations tailored to your permissions.
          </p>
        </div>
        <div className="hero-actions">
          <div
            className="user-chip"
            aria-label={`Signed in as ${user.name} (${user.role || "User"})`}
          >
            <span className="avatar">{initials}</span>
            <div className="user-meta">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.role?.role_name || user.role || "User"}
              </span>
            </div>
          </div>
          <button className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-button ${activeView === item.key ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="dashboard-grid">{renderView()}</div>

      {selectedDocId && (
        <DocumentDetails
          documentId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
          user={user}
        />
      )}
    </div>
  );
}
