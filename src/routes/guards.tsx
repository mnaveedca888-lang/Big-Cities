import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, type Permission } from '@/contexts/PermissionsContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function AdminRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/forbidden" replace />;
}

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { can } = usePermissions();
  return can(permission) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
