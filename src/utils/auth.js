export const getUser = () => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
};

const normalizeRole = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role.toUpperCase();
  if (typeof role === "object") {
    if (role.role_name) return String(role.role_name).toUpperCase();
    if (role.name) return String(role.name).toUpperCase();
    if (role.role) return String(role.role).toUpperCase();
  }
  return "";
};

export const hasRole = (roles, userOverride = null) => {
  const user = userOverride || getUser();
  if (!user || !Array.isArray(roles) || roles.length === 0) return false;

  const targetRoles = roles.map(normalizeRole).filter(Boolean);
  const userRole = normalizeRole(user.role);
  if (!userRole) return false;

  return targetRoles.includes(userRole);
};
