import { Trash2, UserPlus } from 'lucide-react'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { EmptyState, ErrorState, InitialsTile } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { useAttendantForm, useTeamTab } from '../hooks/useTeamTab'

function AddAttendantModal({ onClose }: { onClose: () => void }) {
  const form = useAttendantForm(onClose)
  return <FormModal open onClose={onClose} eyebrow="Team" title="Add attendee" description="They get a text with how to sign in." onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Add attendee</Button>
  </>}>
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" error={form.errors.firstname?.message} {...form.register('firstname')}/>
        <Field label="Last name" error={form.errors.lastname?.message} {...form.register('lastname')}/>
      </div>
      <Field label="Phone number" type="tel" placeholder="0803 245 7791" error={form.errors.phone?.message} {...form.register('phone')}/>
      <OptionSelect label="Role" options={form.roleOptions} error={form.errors.role?.message} {...form.register('role')}/>
    </div>
  </FormModal>
}

export function TeamTab() {
  const tab = useTeamTab()
  return <div className="rounded-2xl border border-border bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
      <div className="min-w-0"><h3 className="font-black text-[#173A2E]">Attendees & team</h3><p className="text-xs font-semibold text-[#879A91]">Assign bookings to the right person.</p></div>
      <Button onClick={tab.openModal}><UserPlus size={16}/> Add attendee</Button>
    </div>
    {tab.isError && <ErrorState title="We couldn’t load your team" onRetry={tab.retry} className="m-5"/>}
    {tab.isLoading && <ListSkeleton rows={3} rowClassName="flex items-center gap-3 border-b border-border p-5 last:border-0"/>}
    {!tab.isLoading && !tab.isError && tab.members.length === 0 && <EmptyState icon={<UserPlus size={20}/>} title="No attendees yet" text="Add the people who take appointments, so bookings can be assigned to them."/>}
    {tab.members.map(({ member, initials, color, canRemove }) => <div key={member.id} className="flex items-center gap-3 border-b border-border p-5 last:border-0">
      <InitialsTile initials={initials} color={color} className="h-11 w-11 rounded-xl text-xs"/>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#29483B]">{member.name}</p><p className="truncate text-xs font-bold text-[#879A91]">{member.roleLabel}</p></div>
      <span className="shrink-0 rounded-full bg-[#E2F7E9] px-2.5 py-1 text-[10px] font-black text-[#157443]">{member.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
      {canRemove && <ActionMenu label={`Actions for ${member.name}`} items={[{ label: 'Remove attendee', icon: <Trash2 size={14}/>, danger: true, onSelect: () => void tab.removeMember(member) }]}/>}
    </div>)}
    {tab.modalOpen && <AddAttendantModal onClose={tab.closeModal}/>}
  </div>
}
