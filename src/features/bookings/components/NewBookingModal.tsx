import { ArrowRight, Check, Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, TextareaField, fieldBoxClass, fieldErrorClass, fieldLabelClass } from '@/components/ui/Field'
import { FormDateField } from '@/components/ui/FormDateField'
import { BackLink, ChoiceButton, EmptyState } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { useDismissRoot } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { ClientFormModal } from '@/features/clients/components/ClientFormModal'
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
      : <div className="flex items-stretch gap-2">
        <div className={cn(fieldBoxClass, 'min-w-0 flex-1', errors.clientName && 'border-[#C2483D]')}>
          {client.adding ? <Plus size={15} className="mr-2 shrink-0 text-[#24764F]"/> : <Search size={15} className="mr-2 shrink-0 text-[#82988E]"/>}
          <input id="new-booking-client" autoComplete="off" placeholder={client.adding ? 'New client’s full name' : 'Search or add a new customer'} className="w-full min-w-0 flex-1 bg-transparent py-3 text-sm font-bold text-[#405B50] outline-none placeholder:font-semibold placeholder:text-[#9DAEA6]" {...client.field}/>
        </div>
        {client.adding
          ? <button type="button" aria-label="Cancel new client" title="Back to search" onClick={client.cancelAdding} className="grid w-12 shrink-0 place-items-center rounded-xl border border-border bg-white text-[#536B60] hover:border-[#329661]"><X size={17}/></button>
          : <button type="button" aria-label="Add a new client" title="Add a new client" onClick={client.startNew} className="grid w-12 shrink-0 place-items-center rounded-xl bg-[#173A2E] text-white hover:bg-[#24503F]"><Plus size={18}/></button>}
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

type Line = NewBookingModel['lines'][number]

/** One service line on step 1: service, attendant, remove. Stacks as a card on a phone. */
function ServiceLineCard({ line, model }: { line: Line; model: NewBookingModel }) {
  const { serviceOptions, servicesLoading, setLineService, setLineStaff, removeLine, canRemoveLine } = model
  return <div className="rounded-xl border border-border bg-[#FBFCFA] p-3" data-testid="service-line">
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-[11px] font-black uppercase tracking-wide text-[#6D8378]">Service {line.number}</span>
      <div className="flex min-w-0 items-center gap-2">
        {line.detail && <span className="truncate text-[11px] font-bold text-[#173A2E]">{line.detail}</span>}
        {canRemoveLine && <button type="button" aria-label={`Remove service ${line.number}`} onClick={() => removeLine(line.index)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#8A9C93] hover:bg-[#FDE8E4] hover:text-[#B2402F]"><Trash2 size={14}/></button>}
      </div>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <OptionSelect aria-label={`Service ${line.number}`} placeholder={servicesLoading ? 'Loading services…' : 'Select a service'} options={serviceOptions} value={line.serviceId} onValueChange={value => setLineService(line.index, value)} error={line.serviceError}/>
      <OptionSelect aria-label={`Attendant for service ${line.number}`} placeholder={!line.serviceId ? 'Attendant' : line.attendantOptions.length ? 'Select' : 'None available'} options={line.attendantOptions} value={line.staffId} onValueChange={value => setLineStaff(line.index, value)} error={line.staffError} disabled={!line.serviceId}/>
    </div>
  </div>
}

function DetailsStep({ model }: { model: NewBookingModel }) {
  const { register, errors, paid, setPaid, method, setMethod, bankOptions, summary, lines, addLine } = model
  return <div className="flex flex-col gap-4">
    <ClientPicker model={model}/>
    <FormDateField control={model.control} name="date" label="Date"/>
    <div>
      <span className={fieldLabelClass}>Services</span>
      <div className="flex flex-col gap-2">
        {lines.map(line => <ServiceLineCard key={line.key} line={line} model={model}/>)}
      </div>
      <button type="button" onClick={addLine} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#9DBFAA] py-2.5 text-xs font-black text-[#24764F] hover:border-[#329661] hover:bg-[#F2F6F1]"><Plus size={14}/> Add service</button>
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
      <div className="flex justify-between text-xs font-bold text-[#6D8378]"><span>{summary.count > 1 ? `Total duration (${summary.count} services)` : 'Duration'}</span><span className="text-[#173A2E]">{summary.duration}</span></div>
      <div className="mt-2 flex justify-between text-xs font-bold text-[#6D8378]"><span>{summary.count > 1 ? 'Total amount due' : 'Amount due'}</span><span className="text-[#173A2E]">{summary.amountDue}</span></div>
    </div>
  </div>
}

/** One service line on step 2: its free times and a typed time. */
function LineTimes({ line, model }: { line: Line; model: NewBookingModel }) {
  const { slotsLoading, isClosedDay, setLineTime, minTime, lines } = model
  const multiple = lines.length > 1
  return <section className={cn(multiple && 'rounded-xl border border-border p-3', line.timeError && 'border-[#C2483D]')} aria-label={`Time for ${line.serviceName || `service ${line.number}`}`} data-testid="line-times">
    {multiple && <div className="mb-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#173A2E]">{line.number}. {line.serviceName}</p>
        <p className="truncate text-[11px] font-semibold text-[#6D8378]">{line.detail}{line.staffName && ` · with ${line.staffName}`}</p>
      </div>
      {line.time && <span className="shrink-0 rounded-lg bg-[#E8F7ED] px-2 py-1 font-mono text-[11px] font-bold text-[#176D43]">{line.time}–{line.endTime}</span>}
    </div>}
    {slotsLoading
      ? <SkeletonGroup label="Loading times" className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-11 rounded-xl"/>)}</SkeletonGroup>
      : line.slots.length === 0
        ? <EmptyState title={isClosedDay ? 'You’re closed on this day' : 'No free times on this day'} text={isClosedDay ? 'Go back and pick another date.' : 'Enter a specific time, or go back and change the date or attendant.'} className="py-4"/>
        : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{line.slots.map(slot => <button key={slot} type="button" aria-pressed={slot === line.time} onClick={() => setLineTime(line.index, slot)} className={cn('rounded-xl border py-3 font-mono text-xs font-bold', slot === line.time ? 'border-[#173A2E] bg-[#173A2E] text-white' : 'border-border text-[#456055] hover:border-[#329661]')}>{slot}</button>)}</div>}
    {line.isSuggested && <p className="mt-2 text-[11px] font-semibold text-[#24764F]">Suggested right after service {line.number - 1}. Pick another time if you prefer.</p>}
    <label className="mt-3 block">
      <span className={cn(fieldLabelClass, 'text-xs')}>Specific time</span>
      <span className={cn(fieldBoxClass, line.isCustomTime && 'border-[#173A2E] ring-2 ring-[#173A2E]/10')}>
        <input type="time" step={300} min={minTime} value={line.isCustomTime ? line.time : ''} onChange={event => setLineTime(line.index, event.target.value)} aria-label={multiple ? `Specific time for service ${line.number}` : 'Specific time'} className="w-full min-w-0 bg-transparent py-3 font-mono text-sm font-bold text-[#405B50] outline-none"/>
      </span>
      {!multiple && <span className="mt-1.5 block text-[11px] font-semibold text-[#82988E]">Not in the list above? Enter any time you’ve agreed with the client.</span>}
    </label>
    {line.timeError && <p role="alert" className={fieldErrorClass}>{line.timeError}</p>}
  </section>
}

function TimeStep({ model }: { model: NewBookingModel }) {
  const { goBack, dateLabel, lines, register } = model
  return <div>
    <div className="mb-4 flex items-center justify-between gap-3"><BackLink label="Back" onClick={goBack}/><p className="text-sm font-black text-[#173A2E]">{dateLabel}</p></div>
    {lines.length > 1 && <p className="mb-3 text-[11px] font-semibold text-[#82988E]">Pick a start time for each service. Not in the list? Enter any time you’ve agreed with the client.</p>}
    <div className="flex flex-col gap-3">{lines.map(line => <LineTimes key={line.key} line={line} model={model}/>)}</div>
    <TextareaField label="Notes (optional)" rows={2} placeholder="Anything the attendants should know" className="mt-5" {...register('notes')}/>
  </div>
}

/** The design's new booking dialog, on the live service, staff, schedule and customer endpoints. */
export function NewBookingModal() {
  const model = useNewBookingModal()
  const { step, close, onContinue, submit, isSubmitting, hasAllTimes, lines, client } = model
  return <>
  <FormModal
    open
    onClose={close}
    eyebrow={`Step ${step} of 2`}
    title={step === 1 ? 'New booking' : lines.length > 1 ? 'Choose times' : 'Choose a time'}
    onSubmit={submit}
    footer={<>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      {step === 1
        ? <Button onClick={onContinue}>Continue <ArrowRight size={16}/></Button>
        : <Button type="submit" loading={isSubmitting} disabled={!hasAllTimes}>{lines.length > 1 ? `Confirm ${lines.length} bookings` : 'Confirm booking'} <ArrowRight size={16}/></Button>}
    </>}
  >
    {step === 1 ? <DetailsStep model={model}/> : <TimeStep model={model}/>}
  </FormModal>
  {/* Outside the booking form, so saving the client never submits the booking. */}
  {client.isFormOpen && <ClientFormModal client={null} onClose={client.closeForm} onSaved={client.onCreated}/>}
  </>
}
