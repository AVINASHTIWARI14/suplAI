import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-auth-loading">
        <div className="route-auth-loading__card">
          <div
            className="route-auth-loading__spinner"
            aria-hidden="true"
          />
          <span>Loading SuplAI…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/#signup" replace />;
  }

  return children;
};

export default ProtectedRoute;
