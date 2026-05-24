import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function UserProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to home page instead of login page
    return <Navigate to={`/?reason=auth_required&returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}
