import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/auth";

export default function ProtectedRoute({ roles, children }) {
  if (!hasRole(roles)) {
    return <h2 style={{color:"red"}}>Access Denied</h2>;
  }
  return children;
}
