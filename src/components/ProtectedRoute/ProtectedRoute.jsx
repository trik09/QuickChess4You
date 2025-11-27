import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('adminAuth') === 'true';

  if (!isAuthenticated) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
