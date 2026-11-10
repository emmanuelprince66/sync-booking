import { Store } from 'lucide-react'
import { Field, TextareaField } from '@/components/ui/Field'
import { SelectField } from '@/components/ui/SelectField'
import type { StoreDetailsModel } from '../hooks/useStoreDetailsForm'
import { ABOUT_MAX } from '../schemas'
import { CardActions, SectionLabel, SettingsCard } from './SettingsCard'

const GRID = 'grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2'

export function StoreDetailsCard({ details }: { details: StoreDetailsModel }) {
  const { register, errors } = details
  return <SettingsCard icon={Store} title="Details & contact" description="What clients see on your booking page, and how they reach you about appointments.">
    <form onSubmit={details.onSubmit} noValidate>
      <div className={GRID}>
        <Field label="Business name" error={errors.name?.message} {...register('name')}/>
        <SelectField label="Business category" options={details.sectorOptions} {...register('sector')}/>
        <Field label="Tagline" placeholder="Healthy hair, beautiful finishes." className="sm:col-span-2" error={errors.tagline?.message} {...register('tagline')}/>
        <TextareaField label="About your business" rows={4} maxLength={ABOUT_MAX} className="sm:col-span-2" hint={details.aboutCount} error={errors.description?.message} {...register('description')}/>
      </div>

      <SectionLabel>Contact channels</SectionLabel>
      <div className={GRID}>
        <Field label="Phone number" type="tel" placeholder="0803 245 7791" error={errors.phone?.message} {...register('phone')}/>
        <Field label="WhatsApp number" type="tel" placeholder="0803 245 7791" hint="Clients message this number about bookings" error={errors.whatsapp?.message} {...register('whatsapp')}/>
        <Field label="Contact email" type="email" placeholder="hello@yourbusiness.com" className="sm:col-span-2" error={errors.email?.message} {...register('email')}/>
      </div>

      <SectionLabel>Address &amp; currency</SectionLabel>
      <div className={GRID}>
        <Field label="Street address" className="sm:col-span-2" error={errors.street?.message} {...register('street')}/>
        <Field label="City" error={errors.city?.message} {...register('city')}/>
        {details.stateIsList
          ? <SelectField label="State" placeholder={details.statesLoading ? 'Loading…' : 'Select state'} options={details.stateOptions} value={details.state} onValueChange={details.setState}/>
          : <Field label="State" error={errors.state?.message} {...register('state')}/>}
        <Field label="Country" error={errors.country?.message} {...register('country')}/>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Zip code" placeholder="Optional" error={errors.zipCode?.message} {...register('zipCode')}/>
          <SelectField label="Currency" options={details.currencies} {...register('currency')}/>
        </div>
      </div>
      <CardActions type="submit" dirty={details.dirty} saving={details.saving} onReset={details.reset} saveLabel="Save details"/>
    </form>
  </SettingsCard>
}
