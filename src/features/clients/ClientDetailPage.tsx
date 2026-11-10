import { UserX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BackLink, EmptyState, ErrorState } from '@/components/ui/misc'
import { ClientBookingHistory } from './components/ClientBookingHistory'
import { ClientFormModal } from './components/ClientFormModal'
import { ClientDetailSkeleton, ClientHeader, ClientInfoCard, ClientJourneyCard } from './components/ClientProfile'
import { DeleteClientModal } from './components/DeleteClientModal'
import { useClientDetail } from './hooks/useClientDetail'

/** One client: profile, figures, journey and booking history (sink's customer profile). */
export default function ClientDetailPage() {
  const detail = useClientDetail()
  return <div className="mx-auto flex max-w-[1192px] flex-col gap-6 p-5 md:p-8">
    <BackLink label="Back to clients" onClick={detail.goBack} className="self-start"/>
    {detail.isLoading && <ClientDetailSkeleton/>}
    {detail.isError && <ErrorState title="We couldn’t load this client" onRetry={detail.retry}/>}
    {detail.isMissing && <EmptyState icon={<UserX size={20}/>} title="Client not found" text="They may have been removed from your client list." action={<Button variant="outline" onClick={detail.goBack}>See all clients</Button>}/>}
    {detail.client && <>
      <ClientHeader detail={detail}/>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ClientBookingHistory history={detail.history}/>
        <div className="flex min-w-0 flex-col gap-6">
          <ClientInfoCard detail={detail}/>
          <ClientJourneyCard detail={detail}/>
        </div>
      </div>
      {detail.isEditing && <ClientFormModal client={detail.client} onClose={detail.closeEdit}/>}
    </>}
    <DeleteClientModal flow={detail.remove}/>
  </div>
}
