import { z } from 'zod'

export const domainSchema = z.object({
  domain: z.string().trim().min(1, 'Enter a domain').regex(/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+\/?$/i, 'Enter a domain like book.yourbusiness.com'),
})
export type DomainValues = z.infer<typeof domainSchema>

export const paymentOptionsSchema = z.object({
  minDepositPercentage: z.string().refine(value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100, 'Enter a percentage from 1 to 100'),
})
export type PaymentOptionsValues = z.infer<typeof paymentOptionsSchema>
