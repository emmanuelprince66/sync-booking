import { Building2, Check } from 'lucide-react'
import type { Attendant } from '@/api/attendants'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, InitialsTile } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useAttendantBranches } from '../hooks/useAttendantBranches'

/** "Manage branches" for one staff member. */
export function AttendantBranchesModal({ attendant, onClose }: { attendant: Attendant; onClose: () => void }) {
  const flow = useAttendantBranches({ attendant, onClose })
  return <FormModal open onClose={onClose} eyebrow="Branches" title={`Branch access · ${flow.name}`} description="Select which branches this person works at."
    footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={() => void flow.submit()} loading={flow.isSaving} disabled={flow.selectedCount === 0 || flow.isLoading}><Building2 size={16}/> Update branches ({flow.selectedCount})</Button>
    </>}>
    {flow.isError && <ErrorState title="We couldn’t load your branches" onRetry={flow.retry}/>}
    {flow.isLoading && <ListSkeleton rows={3} rowClassName="flex items-center gap-3 rounded-xl border border-border p-3"/>}
    {!flow.isLoading && !flow.isError && flow.branches.length === 0 && <EmptyState icon={<Building2 size={20}/>} title="No branches yet" text="Create a branch in Setup → Branches first."/>}
    <div className="flex flex-col gap-2">
      {flow.branches.map(branch => <button key={branch.id} type="button" role="checkbox" aria-checked={branch.selected} onClick={() => flow.toggle(branch.id)} className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition', branch.selected ? 'border-[#329661] bg-[#F3F9F4]' : 'border-border bg-white hover:border-[#9DB1A9]')}>
        <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border', branch.selected ? 'border-[#173A2E] bg-[#173A2E] text-white' : 'border-[#CAD6CF] bg-white')}>{branch.selected && <Check size={12} strokeWidth={3}/>}</span>
        <InitialsTile initials={branch.initials} image={branch.logo || undefined} color="bg-[#EDF4EF]" className="h-10 w-10 rounded-xl text-xs"/>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-[#173A2E]">{branch.name}</span>
          <span className="block truncate text-[11px] font-semibold text-[#829189]">{branch.address || 'No address added yet'}</span>
        </span>
        {branch.type && <span className="hidden shrink-0 rounded-full bg-[#F1F5F2] px-2 py-0.5 text-[9px] font-bold text-[#5E7268] sm:inline">{branch.type}</span>}
      </button>)}
    </div>
  </FormModal>
}
