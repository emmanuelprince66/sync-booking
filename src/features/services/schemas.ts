import { z } from 'zod'

/** Sink's rules: a name and category, a positive amount, a capacity of at least one, deposit 1–100 or blank. */
export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Enter a service name').max(150, 'Keep it under 150 characters'),
  categoryId: z.string().min(1, 'Choose a category'),
  duration: z.string().min(1, 'Choose a duration'),
  amount: z.string().trim().refine(value => Number.isFinite(Number(value)) && Number(value) > 0, 'Enter a price above zero'),
  description: z.string(),
  minDepositPercentage: z.string().trim().refine(value => !value || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100), 'Enter a percentage from 1 to 100, or leave blank'),
  maxCapacity: z.string().trim().refine(value => Number.isInteger(Number(value)) && Number(value) >= 1, 'At least 1'),
  staffIds: z.array(z.string()),
})
export type ServiceValues = z.infer<typeof serviceSchema>
