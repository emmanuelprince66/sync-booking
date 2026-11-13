import { usePermissions } from '@/hooks/usePermissions'

/**
 * Who can do what on the Team and branch staff screens (sink VeiwStaff: staff:invite and
 * staff:manage_roles, else the admin roles). Setup itself needs settings:view.
 */
export function useTeamAccess() {
  const { canInviteStaff, canManageStaff } = usePermissions()
  return { canInvite: canInviteStaff, canManage: canManageStaff }
}
