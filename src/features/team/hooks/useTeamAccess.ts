import { isMatrix } from '@/api/attendants'
import { useAuthStore } from '@/stores/auth-store'

/** Sink's isAdminLike: the fallback for logins without a permissions checklist. */
const isAdminLike = (role: string | undefined) => !role || role === 'OWNER' || role === 'ADMIN-ATTENDANT' || role === 'MANAGER'

/**
 * Who can do what on the Team page, as sink's useCan: owners can do everything,
 * a permissions checklist decides for staff, and older logins fall back to the role.
 */
export function useTeamAccess() {
  const user = useAuthStore(state => state.user)
  const role = user?.role as string | undefined
  const matrix = (user?.permissions as { permissions_matrix?: unknown } | undefined)?.permissions_matrix
  const can = (action: string) => {
    if (!role || role === 'OWNER') return true
    if (!isMatrix(matrix)) return isAdminLike(role)
    return matrix.staff?.includes(action) ?? false
  }
  return { canInvite: can('invite'), canManage: can('manage_roles'), isOwner: !role || role === 'OWNER' }
}
