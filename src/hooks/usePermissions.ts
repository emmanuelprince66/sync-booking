import { useMemo } from 'react'
import { permissionsFor } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth-store'

/** The signed-in user's permissions, from the auth store's role, id and the permissions their login carries. */
export function usePermissions() {
  const id = useAuthStore(state => state.user?.id)
  const role = useAuthStore(state => state.user?.role)
  const permissions = useAuthStore(state => state.user?.permissions)
  return useMemo(() => permissionsFor({ id, role, permissions }), [id, role, permissions])
}

/** Just the staff id bookings are narrowed to ('' for Super admins). Used by the bookings API hooks. */
export const useStaffScopeId = () => usePermissions().staffScopeId
