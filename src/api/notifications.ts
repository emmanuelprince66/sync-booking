import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Top-bar bell, same endpoints as sink-inventory:
 *  GET  notification/{business_id}/              → { unread_count, notifications: [...] } (recent 20)
 *  GET  notification/unread-count/{business_id}/ → { unread_notifications_count }
 *  POST notification/mark-all-read/{business_id}/
 */

export type AppNotification = { id: string; message: string; isRead: boolean; createdAt: string }

const getUnreadCount = async (businessId: string) => {
  if (!isLive()) return mockDelay(sample.notifications.filter(item => !item.isRead).length)
  const payload = asRecord(await apiRequest<unknown>(`notification/unread-count/${businessId}/`))
  const data = asRecord(payload.data ?? payload)
  return num(data.unread_notifications_count ?? data.unread_count)
}

const getNotifications = async (businessId: string): Promise<AppNotification[]> => {
  if (!isLive()) return mockDelay([...sample.notifications])
  const payload = asRecord(await apiRequest<unknown>(`notification/${businessId}/`))
  return listFrom(payload.data ?? payload, ['notifications', 'results']).map(value => {
    const item = asRecord(value)
    return { id: str(item.id), message: str(item.message), isRead: item.is_read === true, createdAt: str(item.created_at) }
  })
}

const markAllRead = async (businessId: string) => {
  if (!isLive()) {
    sample.notifications = sample.notifications.map(item => ({ ...item, isRead: true }))
    return mockDelay(null)
  }
  return apiRequest<unknown>(`notification/mark-all-read/${businessId}/`, { method: 'POST' })
}

export const useUnreadNotifications = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.notifications, 'unread', scope],
    queryFn: () => getUnreadCount(scope),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

/** Loaded when the bell's panel opens. */
export const useNotifications = (open: boolean) => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.notifications, 'list', scope], queryFn: () => getNotifications(scope), enabled: enabled && open, staleTime: 30_000 })
}

export const useMarkAllNotificationsRead = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => markAllRead(scope), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }) })
}
