import { ConfirmModal } from '@/components/ui/Modal'
import type { DeleteClientFlow } from '../hooks/useDeleteClient'

/** "Delete this client?" — used by the list and the client page. */
export function DeleteClientModal({ flow }: { flow: DeleteClientFlow }) {
  if (!flow.target) return null
  return <ConfirmModal onClose={flow.cancel} eyebrow="Clients" title="Delete client" confirmLabel="Delete client" cancelLabel="Keep client" isConfirming={flow.isDeleting} onConfirm={() => void flow.confirm()}>
    Remove <strong className="font-black text-[#173A2E]">{flow.target.name}</strong> from your client list? Their past bookings stay on record. This can’t be undone.
  </ConfirmModal>
}
