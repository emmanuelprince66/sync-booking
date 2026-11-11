import { useState } from 'react'
import { useAttendantPermissions, useRolePermissionDefaults, type PermissionsMatrix, type PermissionsSave } from '@/api/attendants'
import { sameActions, sameMatrix } from '../permissions'

type Edits = {
  role: string
  /** True after Reset or on a role other than the saved one: the base is the role's defaults. */
  fromDefaults: boolean
  matrix: PermissionsMatrix | null
  /** Modules changed by hand. */
  touched: string[]
}

/**
 * The permissions checklist on Add/Edit staff (sink-inventory's useStaffPermissionMatrix).
 * A role fills it with that role's defaults and the owner fine-tunes from there.
 * Picking a role replaces the checklist; ticking boxes doesn't change the role.
 *
 * Only modules ticked by hand count as changed. Everything else comes from the
 * saved copy at save time, and a checklist matching the role's defaults is left
 * out of the payload so the backend re-applies them.
 */
export function usePermissionMatrix({ role, attendantId, savedRole }: { role?: string; attendantId?: string; savedRole?: string }) {
  const isEdit = Boolean(attendantId)
  const defaultsQuery = useRolePermissionDefaults()
  const savedQuery = useAttendantPermissions(attendantId ?? '')
  const [edits, setEdits] = useState<Edits | null>(null)

  const defaults = defaultsQuery.data ?? null
  const savedMatrix = savedQuery.data ?? null
  const roleDefault = role ? (defaults?.role_defaults[role] ?? null) : null
  const isSavedRole = isEdit && role === savedRole
  const current = edits && edits.role === role ? edits : null
  const fromDefaults = current ? current.fromDefaults : !isSavedRole
  const touched = current?.touched ?? []

  const initial = !role ? null : !fromDefaults ? (savedQuery.isError ? null : (savedMatrix ?? roleDefault)) : roleDefault
  const matrix = current ? current.matrix : initial

  const onChange = (next: PermissionsMatrix) => {
    if (!role) return
    const changed = [...new Set([...Object.keys(matrix ?? {}), ...Object.keys(next)])].filter(module => !sameActions(matrix?.[module], next[module]))
    setEdits({ role, fromDefaults, matrix: next, touched: [...new Set([...touched, ...changed])] })
  }

  const onReset = () => {
    if (!role || !roleDefault) return
    setEdits({ role, fromDefaults: true, matrix: roleDefault, touched: [] })
  }

  const resolveForSave = (): PermissionsSave => {
    const base = fromDefaults || !isSavedRole ? roleDefault : savedMatrix
    // Nothing known to build on: on an unchanged role, leave what's saved; otherwise the backend applies the new role's defaults.
    if (!base) return isSavedRole ? { keepSaved: true } : {}
    const final: PermissionsMatrix = { ...base }
    for (const module of touched) final[module] = matrix?.[module] ?? []
    if (roleDefault && sameMatrix(final, roleDefault)) return {}
    if (isSavedRole && !touched.length && !fromDefaults) return { keepSaved: true }
    return { setPermissions: { permissions_matrix: final } }
  }

  return {
    resolveForSave,
    editor: {
      role,
      modules: defaults?.modules ?? null,
      value: matrix,
      onChange,
      onReset,
      isCustom: Boolean(matrix && roleDefault && !sameMatrix(matrix, roleDefault)),
      canReset: Boolean(roleDefault),
      isLoading: Boolean(role) && (defaultsQuery.isLoading || (isEdit && savedQuery.isLoading)),
      isError: defaultsQuery.isError || (isSavedRole && savedQuery.isError),
      onRetry: () => {
        void defaultsQuery.refetch()
        if (isEdit) void savedQuery.refetch()
      },
    },
  }
}

export type PermissionMatrixEditor = ReturnType<typeof usePermissionMatrix>['editor']
