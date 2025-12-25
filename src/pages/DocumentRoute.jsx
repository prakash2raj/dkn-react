import { useMemo } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import DocumentDetails from "./DocumentDetails";

export default function DocumentRoute({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(
    () => location.state?.from || "/dashboard/knowledge",
    [location.state?.from]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DocumentDetails
      documentId={id}
      onClose={() => navigate(from, { replace: false })}
      user={user}
    />
  );
}
