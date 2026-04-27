import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getCurrentUserRole, isAuthenticated, type AppRole } from '../auth';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
};

const ProtectedRoute = ({ children, allowedRoles, redirectTo = '/accounts' }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getCurrentUserRole();
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
