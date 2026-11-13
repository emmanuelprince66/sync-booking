import { z } from 'zod'
import { TEAM_ROLE_VALUES } from '@/api/attendants'

/** Sink-inventory's staff form: first and last name (max 50), phone, and Attendant or Super admin. */
export const staffSchema = z.object({
  firstname: z.string().trim().min(1, 'First name is required').max(50, 'Keep it under 50 characters'),
  lastname: z.string().trim().min(1, 'Last name is required').max(50, 'Keep it under 50 characters'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  role: z.enum(TEAM_ROLE_VALUES, { message: 'Please select a role' }),
})

export type StaffFormValues = z.infer<typeof staffSchema>
