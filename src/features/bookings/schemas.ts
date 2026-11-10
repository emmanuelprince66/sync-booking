import { z } from 'zod'

const optionalEmail = z.string().trim().email('Enter a valid email address').or(z.literal(''))

export const newBookingSchema = z.object({
  customerId: z.string(),
  clientName: z.string().trim().min(1, 'Choose a client or type a new name'),
  clientPhone: z.string().trim(),
  clientEmail: optionalEmail,
  serviceId: z.string().min(1, 'Select a service'),
  date: z.string().min(1, 'Choose a date'),
  staffId: z.string().min(1, 'No eligible attendee for this service'),
  paid: z.boolean(),
  method: z.enum(['CASH', 'CARD', 'TRANSFER']),
  bankId: z.string(),
  time: z.string(),
  notes: z.string(),
}).superRefine((values, context) => {
  if (!values.customerId && values.clientPhone.length < 7) context.addIssue({ code: 'custom', path: ['clientPhone'], message: 'Enter the client’s phone number' })
  if (values.paid && values.method === 'TRANSFER' && !values.bankId) context.addIssue({ code: 'custom', path: ['bankId'], message: 'Select the receiving account' })
})
export type NewBookingValues = z.infer<typeof newBookingSchema>

/** Sink's rule: more than zero and no more than the balance due. */
export const checkoutSchema = (balanceDue: number) => z.object({
  amount: z.string().trim().refine(value => { const amount = Number(value); return Number.isFinite(amount) && amount > 0 && amount <= balanceDue }, 'Enter an amount above zero and no more than the balance due'),
  method: z.enum(['CASH', 'CARD', 'TRANSFER']),
  bankId: z.string(),
}).superRefine((values, context) => {
  if (values.method === 'TRANSFER' && !values.bankId) context.addIssue({ code: 'custom', path: ['bankId'], message: 'Select the receiving account' })
})
export type CheckoutValues = z.infer<ReturnType<typeof checkoutSchema>>

export const rescheduleSchema = z.object({
  date: z.string().min(1, 'Choose a date'),
  time: z.string().min(1, 'Choose a time'),
})
export type RescheduleValues = z.infer<typeof rescheduleSchema>

export const cancelSchema = z.object({ reason: z.string().trim().min(1, 'Add a reason for the cancellation') })
export type CancelValues = z.infer<typeof cancelSchema>

export const refundSchema = z.object({
  method: z.enum(['BANK_TRANSFER', 'CASH']),
  reference: z.string(),
  notes: z.string(),
})
export type RefundValues = z.infer<typeof refundSchema>

export const reassignSchema = z.object({ staffId: z.string().min(1, 'Choose an attendee') })
export type ReassignValues = z.infer<typeof reassignSchema>
