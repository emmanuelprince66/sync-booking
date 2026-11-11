import { ArrowRightLeft, Check, Users } from 'lucide-react'
import { roleLabel } from '@/api/attendants'
import { Button } from '@/components/ui/Button'
import { BackLink, EmptyState, ErrorState, InitialsTile, PageTitle } from '@/components/ui/misc'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useBranchStaffPage } from './hooks/useBranchStaffPage'

/** /branches/:branchId: tick who works at this branch. */
export default function BranchStaffPage() {
  const page = useBranchStaffPage()
  return <div className="mx-auto max-w-[900px] p-5 pb-28 md:p-8 md:pb-28">
    <BackLink label="Back to branches" onClick={page.goBack} className="mb-4"/>
    {page.isNotFound
      ? <div className="rounded-2xl border border-border bg-white"><EmptyState title="Branch not found" text="It may have been deleted, or you no longer have access to it." action={<Button variant="outline" onClick={page.goBack}>Back to branches</Button>}/></div>
      : <>
        <PageTitle title={page.name} subtitle={page.address || 'Staff working at this branch'} actions={page.isCurrent
          ? <span className="inline-flex h-11 items-center rounded-xl bg-[#E2F7E9] px-4 text-xs font-extrabold text-[#24764F]">Current branch</span>
          : page.branch && <Button variant="outline" onClick={page.switchHere}><ArrowRightLeft size={16}/> Switch to this branch</Button>}/>

        <section className="rounded-2xl border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div className="min-w-0">
              <h2 className="font-black text-[#173A2E]">Who works here</h2>
              <p className="text-xs font-semibold text-[#879A91]">{page.isLoading ? 'Loading staff…' : `${page.workingCount} of ${page.people.length} staff members`}</p>
            </div>
            <Button variant="ghost" onClick={page.goToTeam} className="h-9 text-xs"><Users size={15}/> Manage team</Button>
          </div>
          {page.isError && <ErrorState title="We couldn’t load this branch’s staff" onRetry={page.retry} className="m-5"/>}
          {page.isLoading && <ListSkeleton rows={4} rowClassName="flex items-center gap-3 border-b border-border p-5 last:border-0"/>}
          {!page.isLoading && !page.isError && page.people.length === 0 && <EmptyState icon={<Users size={20}/>} title="No staff to assign yet" text="Add staff members on the Team page, then come back to place them at this branch." action={<Button onClick={page.goToTeam}>Go to Team</Button>}/>}
          {!page.isLoading && !page.isError && <ul>
            {page.people.map(person => <li key={person.attendant.id} className="border-b border-border last:border-0">
              <button type="button" role="checkbox" aria-checked={person.worksHere} disabled={!page.canManage} onClick={() => page.toggle(person)} className={cn('flex w-full items-center gap-3 p-4 text-left transition sm:px-5', person.changed ? 'bg-[#FFFBEF]' : 'hover:bg-[#FAFCFA]', !page.canManage && 'cursor-default')}>
                <InitialsTile initials={person.initials} color={person.color} className="h-10 w-10 rounded-xl text-xs"/>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-[#29483B]">{person.attendant.name}</span>
                  <span className="block truncate text-xs font-semibold text-[#8A9C93]">{roleLabel(person.attendant.role)}{person.elsewhere.length > 0 && ` · Also at ${person.elsewhere.join(', ')}`}</span>
                </span>
                <span className={cn('hidden text-[11px] font-extrabold sm:inline', person.worksHere ? 'text-[#24764F]' : 'text-[#9AABA4]')}>{person.worksHere ? 'Works here' : 'Not here'}</span>
                <span className={cn('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border', person.worksHere ? 'border-[#173A2E] bg-[#173A2E] text-white' : 'border-[#CAD6CF] bg-white')}>{person.worksHere && <Check size={14} strokeWidth={3}/>}</span>
              </button>
            </li>)}
          </ul>}
        </section>
      </>}

    {page.changedCount > 0 && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-5 py-3 backdrop-blur lg:left-[248px]">
      <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3">
        <p className="text-xs font-extrabold text-[#29483B]">{page.changedCount} unsaved {page.changedCount === 1 ? 'change' : 'changes'}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={page.discard} disabled={page.isSaving}>Discard</Button>
          <Button onClick={() => void page.saveChanges()} loading={page.isSaving}>Save</Button>
        </div>
      </div>
    </div>}
  </div>
}
