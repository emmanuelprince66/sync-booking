import { z } from 'zod'
import { CURRENCY_OPTIONS } from '@/api/storefront'

export const ABOUT_MAX = 300
export const TAGLINE_MAX = 150

const phone = z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, 'Enter a valid phone number, e.g. 0803 245 7791')

/** Store details and contact channels (SyncShip's store details card, CLIQBOOK's limits). */
export const storeDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Enter your business name').max(250, 'Keep it under 250 characters'),
  sector: z.string(),
  tagline: z.string().trim().max(TAGLINE_MAX, `Keep the tagline under ${TAGLINE_MAX} characters`),
  description: z.string().max(ABOUT_MAX, `Keep it under ${ABOUT_MAX} characters`),
  phone: z.union([z.literal(''), phone]),
  whatsapp: z.union([z.literal(''), phone]),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]),
  street: z.string().trim().max(100, 'Keep it under 100 characters'),
  city: z.string().trim().max(100),
  state: z.string().trim().max(50),
  country: z.string().trim().max(50),
  zipCode: z.string().trim().max(12, 'Keep it under 12 characters'),
  currency: z.enum(CURRENCY_OPTIONS),
})
export type StoreDetailsValues = z.infer<typeof storeDetailsSchema>

/** The booking-policy part of the storefront (booking settings). */
export const policiesSchema = z.object({
  policyText: z.string().max(2000, 'Keep it under 2000 characters'),
  cancellationWindowHours: z.string(),
  isDepositNonRefundable: z.boolean(),
})
export type PoliciesValues = z.infer<typeof policiesSchema>

/** book.yourbusiness.com: at least one dot, letters, digits and hyphens per label. */
export const domainSchema = z.string().regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i, 'Enter a valid domain, such as book.yourbusiness.com')
