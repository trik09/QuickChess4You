import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function UserProtectedRoute({ children }) {
  const { isUserAuthenticated } = useAuth();

  // if (!isUserAuthenticated) {
  //   return <Navigate to="/" replace />;
  // }

  return children;
}
