import { z } from 'zod'

/** Sink's rule: a name is all a category needs. */
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100, 'Keep it under 100 characters'),
})
export type CategoryValues = z.infer<typeof categorySchema>
