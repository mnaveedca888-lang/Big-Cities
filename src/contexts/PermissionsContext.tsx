import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type Permission = 'events:read' | 'events:write' | 'users:read' | 'users:write' | 'analytics:read' | 'settings:write';
interface PermissionsValue { permissions: Permission[]; can: (permission: Permission) => boolean; }
const PermissionsContext = createContext<PermissionsValue | undefined>(undefined);

const memberPermissions: Permission[] = ['events:read', 'analytics:read'];
const adminPermissions: Permission[] = [...memberPermissions, 'events:write', 'users:read', 'users:write', 'settings:write'];

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const permissions = user?.role === 'admin' ? adminPermissions : user ? memberPermissions : [];
  const value = useMemo(() => ({ permissions, can: (permission: Permission) => permissions.includes(permission) }), [permissions]);
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) throw new Error('usePermissions must be used within PermissionsProvider');
  return context;
}
