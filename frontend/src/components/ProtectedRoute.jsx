import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';

/** Guards nested routes: unauthenticated visitors are sent to the login page. */
const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
