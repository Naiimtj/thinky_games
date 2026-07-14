import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';

/** Guards nested routes: unauthenticated visitors are sent to the login page. */
const ProtectedRoute = () => {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const location = useLocation();

  if (!initialized) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
