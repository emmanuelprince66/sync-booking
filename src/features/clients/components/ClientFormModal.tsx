import { CircleAlert, UserCheck } from 'lucide-react'
import type { Customer } from '@/api/customers'
import { AddressField } from '@/components/ui/AddressField'
import { BirthdayField } from '@/components/ui/BirthdayField'
import { Button } from '@/components/ui/Button'
import { Field, TextareaField } from '@/components/ui/Field'
import { FormModal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useClientForm } from '../hooks/useClientForm'

/** The number is on file: show who, before details are typed for a record that already exists. */
function PhoneMatches({ matches, onFill }: { matches: Customer[]; onFill: (client: Customer) => void }) {
  return <div className="rounded-xl border border-[#D6E3F7] bg-[#F1F6FD] p-3">
    <p className="flex items-center gap-2 text-xs font-extrabold text-[#2F518F]"><UserCheck size={15} className="shrink-0"/>{matches.length === 1 ? 'This number is already on file' : `${matches.length} clients have this number`}</p>
    <div className="mt-2 flex flex-col gap-2">
      {matches.map(match => <div key={match.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#29483B]">{match.name}</p><p className="truncate text-[11px] font-semibold text-[#8A9C93]">{match.phone}{match.email ? ` · ${match.email}` : ''}</p></div>
        <Button variant="outline" onClick={() => onFill(match)} className="h-8 rounded-lg px-3 text-[11px]">Fill in details</Button>
      </div>)}
    </div>
  </div>
}

/** Add or edit a client, with every field sink's customer form has. Header and footer stay put while the body scrolls. */
export function ClientFormModal({ client, onClose }: { client: Customer | null; onClose: () => void }) {
  const form = useClientForm(client, onClose)
  return <FormModal open onClose={onClose} eyebrow="Clients" title={form.isEditing ? 'Edit client' : 'Add a client'} maxWidthClassName="max-w-[600px]" onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>{form.isEditing ? 'Save changes' : 'Save client'}</Button>
  </>}>
    <div className="flex flex-col gap-4">
      <Field label="Name" placeholder="Amara Okafor" error={form.errors.name?.message} {...form.register('name')}/>
      <Field label="Phone number" type="tel" placeholder="0803 245 7791" hint={form.isCheckingPhone ? 'Checking for an existing client…' : undefined} error={form.errors.phone?.message} {...form.register('phone')}/>
      {form.phoneMatches.length > 0 && <PhoneMatches matches={form.phoneMatches} onFill={form.fillFrom}/>}
      <Field label="Email" type="email" placeholder="client@email.com" error={form.errors.email?.message} {...form.register('email')}/>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)]">
        <Select label="Gender" placeholder="Select gender" searchable={false} options={form.genderOptions} value={form.gender} onValueChange={form.setGender}/>
        <BirthdayField label="Date of birth" value={form.dateOfBirth} onChange={form.setDateOfBirth}/>
      </div>
      {/* Above state and city on purpose: picking a suggestion fills both. */}
      <AddressField label="Address" placeholder="Start typing an address…" value={form.address} onChange={form.setAddress} onSelect={form.pickAddress} isPinned={form.isAddressPinned} error={form.errors.address?.message}/>
      <div className="grid grid-cols-2 gap-4">
        <Select label="State" placeholder={form.statesLoading ? 'Loading…' : 'Select state'} options={form.stateOptions} value={form.state} onValueChange={form.setState}/>
        {form.cityIsFreeText
          ? <Field label="City" placeholder="Enter city" {...form.register('city')}/>
          : <Select label="City" placeholder={form.cityDisabled ? 'Select state first' : 'Select city'} disabled={form.cityDisabled} options={form.cityOptions} value={form.city} onValueChange={form.setCity}/>}
      </div>
      <TextareaField label="Notes" placeholder="Preferences, allergies, anything worth remembering…" rows={3} error={form.errors.notes?.message} {...form.register('notes')}/>
      {!form.isEditing && <div className="flex items-start gap-3 rounded-xl border border-[#D6E3F7] bg-[#F1F6FD] p-3 text-[#2F518F]">
        <CircleAlert size={17} className="mt-0.5 shrink-0"/>
        <p className="text-xs font-semibold leading-5">You should ask your clients for permission before you subscribe them to your marketing emails or SMS.</p>
      </div>}
    </div>
  </FormModal>
}
