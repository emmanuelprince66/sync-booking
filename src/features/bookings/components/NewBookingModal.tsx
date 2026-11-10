import { ArrowRight, Check, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, TextareaField, fieldBoxClass, fieldErrorClass, fieldLabelClass } from '@/components/ui/Field'
import { FormDateField } from '@/components/ui/FormDateField'
import { BackLink, ChoiceButton, EmptyState } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { useDismissRoot } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { useNewBookingModal, type NewBookingModel } from '../hooks/useNewBookingModal'
import { PAYMENT_METHODS } from '../constants'

function ClientPicker({ model }: { model: NewBookingModel }) {
  const { client, errors, register, isClientSelected } = model
  const rootRef = useDismissRoot(client.isListOpen, client.closeList)
  return <div ref={rootRef}>
    <label className={fieldLabelClass} htmlFor="new-booking-client">Client name</label>
    {isClientSelected
      ? <div className="flex items-center gap-3 rounded-xl border border-[#329661] bg-[#E8F7ED] px-3 py-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#329661] text-white"><Check size={13} strokeWidth={3}/></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#173A2E]">{client.name}</p><p className="truncate text-[11px] font-semibold text-[#60796E]">{client.phone || 'No phone number'}</p></div>
        <button type="button" aria-label="Choose another client" onClick={client.clear} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#536B60] hover:bg-white/60"><X size={15}/></button>
      </div>
      : <div className={cn(fieldBoxClass, errors.clientName && 'border-[#C2483D]')}>
        <Search size={15} className="mr-2 shrink-0 text-[#82988E]"/>
        <input id="new-booking-client" autoComplete="off" placeholder="Search or add a new customer" className="w-full min-w-0 flex-1 bg-transparent py-3 text-sm font-bold text-[#405B50] outline-none placeholder:font-semibold placeholder:text-[#9DAEA6]" {...client.field}/>
      </div>}
    {errors.clientName && <span role="alert" className={fieldErrorClass}>{errors.clientName.message}</span>}
    {client.showResults && <div className="mt-2 flex max-h-44 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border p-1">
      {client.results.map(item => <button key={item.id} type="button" onClick={() => client.pick(item)} className="flex w-full flex-col rounded-lg px-2.5 py-2 text-left hover:bg-[#F2F6F1]"><span className="truncate text-xs font-extrabold text-[#29483B]">{item.name}</span><span className="truncate text-[11px] font-semibold text-[#8A9C93]">{item.phone || item.email || 'No contact details'}</span></button>)}
      {client.canAddNew && <button type="button" onClick={client.startAdding} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-black text-[#24764F] hover:bg-[#F2F6F1]"><Plus size={14} className="shrink-0"/><span className="truncate">Add “{client.name.trim()}” as a new client</span></button>}
    </div>}
    {client.adding && <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
      <Field label="Phone number" type="tel" placeholder="0803 245 7791" error={errors.clientPhone?.message} {...register('clientPhone')}/>
      <Field label="Email (optional)" type="email" placeholder="client@email.com" error={errors.clientEmail?.message} {...register('clientEmail')}/>
    </div>}
  </div>
}

function DetailsStep({ model }: { model: NewBookingModel }) {
  const { register, errors, serviceOptions, onServiceChange, attendantOptions, paid, setPaid, method, setMethod, bankOptions, summary, servicesLoading } = model
  return <div className="flex flex-col gap-4">
    <ClientPicker model={model}/>
    <OptionSelect label="Service" placeholder={servicesLoading ? 'Loading services…' : 'Select a service'} options={serviceOptions} error={errors.serviceId?.message} {...register('serviceId', { onChange: event => onServiceChange(event.target.value) })}/>
    <div className="grid grid-cols-2 gap-4">
      <FormDateField control={model.control} name="date" label="Date"/>
      <OptionSelect label="Attendee" placeholder={attendantOptions.length ? 'Select' : 'None available'} options={attendantOptions} error={errors.staffId?.message} {...register('staffId')}/>
    </div>
    <div>
      <span className={fieldLabelClass}>Payment status</span>
      <div className="grid grid-cols-2 gap-2">
        <ChoiceButton selected={paid} onClick={() => setPaid(true)}>Paid now</ChoiceButton>
        <ChoiceButton selected={!paid} tone="amber" onClick={() => setPaid(false)}>Pay later</ChoiceButton>
      </div>
    </div>
    {paid && <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">{PAYMENT_METHODS.map(option => <ChoiceButton key={option.value} selected={method === option.value} onClick={() => setMethod(option.value)}>{option.label}</ChoiceButton>)}</div>
      {method === 'TRANSFER' && <OptionSelect label="Receiving account" placeholder="Select an account" options={bankOptions} error={errors.bankId?.message} {...register('bankId')}/>}
    </div>}
    <div className="rounded-xl bg-[#F1F7EE] p-4">
      <div className="flex justify-between text-xs font-bold text-[#6D8378]"><span>Duration</span><span className="text-[#173A2E]">{summary.duration}</span></div>
      <div className="mt-2 flex justify-between text-xs font-bold text-[#6D8378]"><span>Amount due</span><span className="text-[#173A2E]">{summary.amountDue}</span></div>
    </div>
  </div>
}

function TimeStep({ model }: { model: NewBookingModel }) {
  const { goBack, dateLabel, slots, slotsLoading, isClosedDay, time, setTime, register } = model
  return <div>
    <div className="mb-4 flex items-center justify-between gap-3"><BackLink label="Back" onClick={goBack}/><p className="text-sm font-black text-[#173A2E]">{dateLabel}</p></div>
    {slotsLoading
      ? <SkeletonGroup label="Loading times" className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-11 rounded-xl"/>)}</SkeletonGroup>
      : slots.length === 0
        ? <EmptyState title={isClosedDay ? 'You’re closed on this day' : 'No free times on this day'} text="Go back and pick another date, or change the attendee." className="py-6"/>
        : <div className="grid grid-cols-3 gap-2">{slots.map(slot => <button key={slot} type="button" aria-pressed={slot === time} onClick={() => setTime(slot)} className={cn('rounded-xl border py-3 font-mono text-xs font-bold', slot === time ? 'border-[#173A2E] bg-[#173A2E] text-white' : 'border-border text-[#456055] hover:border-[#329661]')}>{slot}</button>)}</div>}
    <TextareaField label="Notes (optional)" rows={2} placeholder="Anything the attendee should know" className="mt-5" {...register('notes')}/>
  </div>
}

/** The design's new booking dialog, on the live service, staff, schedule and customer endpoints. */
export function NewBookingModal() {
  const model = useNewBookingModal()
  const { step, close, onContinue, submit, isSubmitting, time } = model
  return <FormModal
    open
    onClose={close}
    eyebrow={`Step ${step} of 2`}
    title={step === 1 ? 'New booking' : 'Choose a time'}
    onSubmit={submit}
    footer={<>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      {step === 1
        ? <Button onClick={onContinue}>Continue <ArrowRight size={16}/></Button>
        : <Button type="submit" loading={isSubmitting} disabled={!time}>Confirm booking <ArrowRight size={16}/></Button>}
    </>}
  >
    {step === 1 ? <DetailsStep model={model}/> : <TimeStep model={model}/>}
  </FormModal>
}
