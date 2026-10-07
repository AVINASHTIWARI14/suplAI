import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Do not block the whole page with a loading overlay while the
  // session is being restored. Each page can render its own content
  // loading state without replacing the entire app viewport.
  if (loading) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/#signup" replace />;
  }

  return children;
};

export default ProtectedRoute;
