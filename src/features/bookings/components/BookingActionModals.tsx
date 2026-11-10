import type { Booking } from '@/api/bookings'
import { Button } from '@/components/ui/Button'
import { Field, TextareaField, fieldLabelClass } from '@/components/ui/Field'
import { FormDateField } from '@/components/ui/FormDateField'
import { ChoiceButton } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { Select } from '@/components/ui/Select'
import { PAYMENT_METHODS, REFUND_METHODS } from '../constants'
import { useCancelForm, useCheckoutForm, useReassignForm, useRefundForm, useRescheduleForm } from '../hooks/useBookingForms'

type ActionModalProps = { booking: Booking; onClose: () => void }

export function CheckoutModal({ booking, onClose }: ActionModalProps) {
  const form = useCheckoutForm(booking, onClose)
  return <FormModal open onClose={onClose} eyebrow="Appointment" title="Take payment" description={`Balance due: ${form.balance}`} onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Record payment</Button>
  </>}>
    <div className="flex flex-col gap-4">
      <Field label="Amount received" inputMode="decimal" error={form.errors.amount?.message} {...form.register('amount')}/>
      <div><span className={fieldLabelClass}>Method</span><div className="grid grid-cols-3 gap-2">{PAYMENT_METHODS.map(option => <ChoiceButton key={option.value} selected={form.method === option.value} onClick={() => form.setMethod(option.value)}>{option.label}</ChoiceButton>)}</div></div>
      {form.method === 'TRANSFER' && <OptionSelect label="Receiving account" placeholder="Select an account" options={form.bankOptions} error={form.errors.bankId?.message} {...form.register('bankId')}/>}
    </div>
  </FormModal>
}

export function RescheduleModal({ booking, onClose }: ActionModalProps) {
  const form = useRescheduleForm(booking, onClose)
  return <FormModal open onClose={onClose} eyebrow="Appointment" title="Reschedule" onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Save new time</Button>
  </>}>
    <div className="grid grid-cols-2 gap-4">
      <FormDateField control={form.control} name="date" label="Date"/>
      <Select label="Time" options={form.timeOptions} error={form.errors.time?.message} {...form.register('time')}/>
    </div>
  </FormModal>
}

export function CancelBookingModal({ booking, onClose }: ActionModalProps) {
  const form = useCancelForm(booking, onClose)
  return <FormModal open onClose={onClose} eyebrow="Appointment" title="Cancel booking" description="Anything the client already paid moves to your refund queue." onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Keep booking</Button>
    <Button type="submit" variant="danger" loading={form.isSubmitting}>Cancel booking</Button>
  </>}>
    <TextareaField label="Reason" placeholder="Why is this booking being cancelled?" error={form.errors.reason?.message} {...form.register('reason')}/>
  </FormModal>
}

export function RefundModal({ booking, onClose }: ActionModalProps) {
  const form = useRefundForm(booking, onClose)
  return <FormModal open onClose={onClose} eyebrow={`Refund of ${form.amount}`} title="Record refund" description="Confirm you’ve paid this refund to the client. This can’t be undone." onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Record refund</Button>
  </>}>
    <div className="flex flex-col gap-4">
      <div><span className={fieldLabelClass}>Paid by</span><div className="grid grid-cols-2 gap-2">{REFUND_METHODS.map(option => <ChoiceButton key={option.value} selected={form.method === option.value} onClick={() => form.setMethod(option.value)}>{option.label}</ChoiceButton>)}</div></div>
      <Field label="Reference (optional)" placeholder="Transfer reference" {...form.register('reference')}/>
      <TextareaField label="Notes (optional)" rows={2} {...form.register('notes')}/>
    </div>
  </FormModal>
}

export function ReassignModal({ booking, onClose }: ActionModalProps) {
  const form = useReassignForm(booking, onClose)
  return <FormModal open onClose={onClose} eyebrow="Appointment" title="Reassign attendee" onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Save attendee</Button>
  </>}>
    <OptionSelect label="Attendee" placeholder={form.isLoading ? 'Loading…' : 'Select an attendee'} options={form.options} error={form.errors.staffId?.message} {...form.register('staffId')}/>
  </FormModal>
}
