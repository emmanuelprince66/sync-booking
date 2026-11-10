import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteCustomer, type Customer } from '@/api/customers'

/** The delete-with-confirm flow, shared by the list and the client page. `onDeleted` runs after a successful delete. */
export function useDeleteClient(onDeleted?: () => void) {
  const remove = useDeleteCustomer()
  const [target, setTarget] = useState<Customer | null>(null)
  return {
    target,
    ask: (client: Customer) => setTarget(client),
    cancel: () => setTarget(null),
    isDeleting: remove.isPending,
    confirm: async () => {
      if (!target) return
      try {
        await remove.mutateAsync(target.id)
        toast.success(`${target.name} removed`)
        setTarget(null)
        onDeleted?.()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not delete this client.'))
      }
    },
  }
}

export type DeleteClientFlow = ReturnType<typeof useDeleteClient>
