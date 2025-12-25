import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import "./Login.css";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "register") return;

    const defaults = [
      { id: "CONSULTANT", role_name: "CONSULTANT" },
      { id: "CHAMPION", role_name: "CHAMPION" },
      { id: "EXECUTIVE", role_name: "EXECUTIVE" },
      { id: "GOVERNANCE", role_name: "GOVERNANCE" },
    ];

    const existingToken = localStorage.getItem("token");
    if (!existingToken) {
      setRoles(defaults);
      setRole("CONSULTANT");
      setRoleId("");
      setLoadingMeta(false);
      return;
    }

    setLoadingMeta(true);
    apiRequest("/api/roles", "GET", null, existingToken)
      .then((rolesRes) => {
        if (Array.isArray(rolesRes)) {
          const filteredRoles = rolesRes.filter(
            (r) => (r.role_name || "").toUpperCase() !== "ADMIN"
          );
          const effectiveRoles =
            filteredRoles.length > 0 ? filteredRoles : defaults;
          setRoles(effectiveRoles);
          setRole(effectiveRoles[0]?.role_name || "CONSULTANT");
          setRoleId(
            effectiveRoles[0]?.id ? String(effectiveRoles[0].id) : ""
          );
        } else {
          setRoles(defaults);
          setRole("CONSULTANT");
          setMetaError("Unable to load roles from the API, using defaults.");
        }
      })
      .catch(() => {
        setRoles(defaults);
        setRole("CONSULTANT");
        setMetaError("Unable to load roles from the API, using defaults.");
      })
      .finally(() => setLoadingMeta(false));
  }, [mode]);

  const resolvedRoles = useMemo(() => {
    if (!roles || roles.length === 0) {
      return [
        { id: "CONSULTANT", role_name: "CONSULTANT" },
        { id: "CHAMPION", role_name: "CHAMPION" },
        { id: "EXECUTIVE", role_name: "EXECUTIVE" },
        { id: "GOVERNANCE", role_name: "GOVERNANCE" },
      ];
    }
    return roles;
  }, [roles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const payloadRole = role || resolvedRoles[0]?.role_name || "CONSULTANT";
    try {
      if (mode === "register") {
        await apiRequest("/api/register", "POST", {
          name,
          email,
          password,
          role: payloadRole,
          role_id: roleId || null,
        });
      }

      const data = await apiRequest("/api/login", "POST", {
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to authenticate. Check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="card-header">
          <div className="card-header-row">
            <div>
              <p className="eyebrow">
                {mode === "login" ? "Welcome back" : "Create account"}
              </p>
              <h2>{mode === "login" ? "DKN Login" : "DNK Register"}</h2>
            </div>
            <button
              className="mode-switch"
              type="button"
              onClick={toggleMode}
              disabled={submitting}
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </button>
          </div>
          <p className="card-subtitle">
            {mode === "login"
              ? "Enter your credentials to continue."
              : "Register with your role, then sign in immediately."}
          </p>
          {loadingMeta && mode === "register" && (
            <p className="card-subtitle" style={{ marginTop: "0.3rem" }}>
              Loading roles...
            </p>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}
        {mode === "register" && metaError && (
          <div className="error-banner">{metaError}</div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="form-field">
              <span>Full name</span>
              <div className="input-control">
                <span className="input-dot" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Taylor Clark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === "register"}
                />
              </div>
            </label>
          )}

          <label className="form-field">
            <span>Email</span>
            <div className="input-control">
              <span className="input-dot" aria-hidden="true" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Password</span>
            <div className="input-control">
              <span className="input-dot" aria-hidden="true" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          {mode === "register" && (
            <>
              <label className="form-field">
                <span>Role</span>
                <div className="input-control">
                  <span className="input-dot" aria-hidden="true" />
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      const match = resolvedRoles.find(
                        (r) => r.role_name === e.target.value
                      );
                      setRoleId(match?.id ? String(match.id) : "");
                    }}
                    aria-label="Select role"
                    disabled={loadingMeta}
                  >
                    {resolvedRoles.map((r) => (
                      <option key={r.id ?? r.role_name} value={r.role_name}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </>
          )}

          <button className="login-button" type="submit" disabled={submitting}>
            {submitting
              ? "Working..."
              : mode === "login"
              ? "Sign in"
              : "Register & sign in"}
          </button>
        </form>

      </div>
    </div>
  );
}
