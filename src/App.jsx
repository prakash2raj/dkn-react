import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { apiRequest, registerUnauthorizedHandler } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentRoute from "./pages/DocumentRoute";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("user");
      setUser(null);
      setHydrated(true);
      return;
    }

    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    apiRequest("/api/me")
      .then((me) => {
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      handleLogout();
    });

    return () => registerUnauthorizedHandler(null);
  }, [handleLogout]);

  const requireAuth = useCallback(
    (children) => {
      if (!hydrated) {
        return <div style={{ padding: "2rem" }}>Loading workspace...</div>;
      }
      if (!user) {
        return (
          <Navigate
            to="/login"
            replace
            state={{ from: location.pathname + location.search }}
          />
        );
      }
      return children;
    },
    [hydrated, location.pathname, location.search, user]
  );

  const defaultDashboard = "/dashboard";

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={defaultDashboard} replace />
          ) : (
            <Login
              onLogin={(loggedInUser) => {
                setUser(loggedInUser);
                navigate(defaultDashboard, { replace: true });
              }}
            />
          )
        }
      />
      <Route
        path="/dashboard/:view?"
        element={requireAuth(<Dashboard user={user} onLogout={handleLogout} />)}
      />
      <Route
        path="/documents/:id"
        element={requireAuth(<DocumentRoute user={user} />)}
      />
      <Route
        path="/"
        element={
          <Navigate to={user ? defaultDashboard : "/login"} replace />
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={user ? defaultDashboard : "/login"} replace />
        }
      />
    </Routes>
  );
}

export default App;
