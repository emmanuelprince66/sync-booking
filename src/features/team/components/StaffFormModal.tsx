import type { Attendant } from '@/api/attendants'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { FormModal } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { Skeleton } from '@/components/ui/Skeleton'
import { useStaffForm } from '../hooks/useStaffForm'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl bg-[#F7F9F5] p-4">
    <h3 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#82988E]">{title}</h3>
    {children}
  </section>
}

function FormSkeleton() {
  return <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading staff member">
    <div className="rounded-2xl bg-[#F7F9F5] p-4"><Skeleton className="mb-4 h-3 w-32"/><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-[46px] w-full"/><Skeleton className="h-[46px] w-full"/></div><Skeleton className="mt-4 h-[46px] w-full"/></div>
    <div className="rounded-2xl bg-[#F7F9F5] p-4"><Skeleton className="mb-4 h-3 w-24"/><Skeleton className="h-[46px] w-full"/></div>
  </div>
}

/** Add staff member / Edit staff member: details and role (sink's AddStaff and EditStaff). */
export function StaffFormModal({ attendant, onClose }: { attendant: Attendant | null; onClose: () => void }) {
  const form = useStaffForm({ attendant, onClose })
  const title = form.isEdit ? 'Edit staff member' : 'Add staff member'
  return <FormModal open onClose={onClose} eyebrow="Team" title={title} maxWidthClassName="max-w-[640px]"
    description={form.isEdit ? 'Update their details and role.' : 'Create a staff account as an Attendant or a Super admin.'}
    onSubmit={form.onSubmit}
    footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button type="submit" loading={form.isSubmitting} disabled={form.isLoading || Boolean(form.loadError)}>{form.isEdit ? 'Save changes' : 'Add staff member'}</Button>
    </>}>
    {form.isLoading
      ? <FormSkeleton/>
      : form.loadError
        ? <div className="rounded-2xl border border-[#F3D9D5] bg-[#FFF8F6] px-5 py-8 text-center"><p className="text-sm font-extrabold text-[#9A3B2F]">{form.loadError}</p><Button variant="outline" onClick={form.retry} className="mt-4">Try again</Button></div>
        : <div className="flex flex-col gap-5">
          <Section title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" placeholder="Enter first name" maxLength={50} autoComplete="off" error={form.errors.firstname?.message} {...form.register('firstname')}/>
              <Field label="Last name" placeholder="Enter last name" maxLength={50} autoComplete="off" error={form.errors.lastname?.message} {...form.register('lastname')}/>
            </div>
            <Field label="Phone number" type="tel" placeholder="Enter phone number" className="mt-4" autoComplete="off" error={form.errors.phone?.message} {...form.register('phone')}/>
          </Section>
          <Section title="Role assignment">
            <OptionSelect label="Staff role" placeholder="Select a role for this staff member" searchable={false} options={form.roleOptions} error={form.errors.role?.message} hint={form.legacyRoleNote || form.roleHint || undefined} {...form.register('role')}/>
          </Section>
        </div>}
  </FormModal>
}
