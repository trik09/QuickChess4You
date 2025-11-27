import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading } = useAuth();
  const adminToken = localStorage.getItem('atoken');
  const adminIsAuthenticated = adminToken && localStorage.getItem('adminAuth') === 'true';

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if route requires admin authentication
  if (requireAdmin) {
    if (!adminIsAuthenticated || !adminToken) {
      return <Navigate to="/admin/login" replace />;
    }
  } else {
    // For regular user routes, check backend authentication
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
