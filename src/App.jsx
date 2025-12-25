import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

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

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!hydrated && !user) {
    return <div style={{ padding: "2rem" }}>Loading workspace...</div>;
  }

  if (!user) return <Login onLogin={setUser} />;

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;
