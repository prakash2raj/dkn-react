export const getUser = () => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
};

export const hasRole = (roles, userOverride = null) => {
  const user = userOverride || getUser();
  if (!user) return false;
  return roles.includes(user.role);
};
