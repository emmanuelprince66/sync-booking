import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, SectionTitle } from '@/components/ui/misc'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { CreateBusinessModal } from '@/features/business/components/CreateBusinessModal'
import { BranchCard } from './components/BranchCard'
import { useBranchesPage } from './hooks/useBranchesPage'

/** Setup → Branches: the owner's businesses, as sink-inventory treats branches. Create, switch into, and staff each one. */
export function BranchesPanel() {
  const page = useBranchesPage()
  const createButton = page.canCreate && <Button onClick={page.createModal.open}><Plus size={17}/> Create branch</Button>
  return <div className="min-w-0">
    <SectionTitle title="Branches" subtitle="Every location you run, and who works at each." actions={createButton}/>

    {page.isError && <ErrorState title="We couldn’t load your branches" onRetry={page.retry}/>}
    {page.isLoading && <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <CardSkeleton key={index} lines={4}/>)}</div>}
    {page.isEmpty && <div className="rounded-2xl border border-border bg-white"><EmptyState icon={<Building2 size={20}/>} title="No branches yet" text="Create a branch for each location you run. Staff can then be assigned to one or more branches." action={createButton || undefined}/></div>}
    {!page.isLoading && !page.isError && !page.isEmpty && <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {page.cards.map(card => <BranchCard key={card.business.id} card={card} onSwitch={() => page.switchTo(card.business)} onManageStaff={() => page.manageStaff(card.business)}/>)}
    </div>}

    <CreateBusinessModal open={page.createModal.isOpen} onClose={page.createModal.close} onCreated={page.onCreated} title="Create a branch" description="A branch is a separate business with its own bookings, services and staff." submitLabel="Create branch"/>
  </div>
}
