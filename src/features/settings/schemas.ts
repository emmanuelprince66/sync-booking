import { z } from 'zod'
import { MIN_WITHDRAWAL } from '@/api/wallet'

export const attendantSchema = z.object({
  firstname: z.string().trim().min(1, 'Enter a first name'),
  lastname: z.string().trim().min(1, 'Enter a last name'),
  phone: z.string().trim().min(7, 'Enter a phone number'),
  role: z.string().min(1, 'Choose a role'),
})
export type AttendantValues = z.infer<typeof attendantSchema>

export const withdrawSchema = (balance: number) => z.object({
  amount: z.string().trim().refine(value => Number(value) >= MIN_WITHDRAWAL && Number(value) <= balance, 'Enter an amount within your available balance'),
  pin: z.string().regex(/^\d{4,6}$/, 'Enter your transaction PIN'),
})
export type WithdrawValues = z.infer<ReturnType<typeof withdrawSchema>>

export const domainSchema = z.object({
  domain: z.string().trim().min(1, 'Enter a domain').regex(/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+\/?$/i, 'Enter a domain like book.yourbusiness.com'),
})
export type DomainValues = z.infer<typeof domainSchema>

export const paymentOptionsSchema = z.object({
  minDepositPercentage: z.string().refine(value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100, 'Enter a percentage from 1 to 100'),
})
export type PaymentOptionsValues = z.infer<typeof paymentOptionsSchema>
