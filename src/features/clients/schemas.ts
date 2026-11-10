import { z } from 'zod'

/** Sink's CustomerSchema: only a name and phone are required. */
export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).or(z.literal('')),
  dateOfBirth: z.string(),
  address: z.string(),
  addressPhone: z.string(),
  state: z.string(),
  city: z.string(),
  latitude: z.string(),
  longitude: z.string(),
})
export type ClientValues = z.infer<typeof clientSchema>
