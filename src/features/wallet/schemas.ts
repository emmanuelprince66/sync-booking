import { z } from 'zod'
import { WALLET_PIN_LENGTH } from '@/api/wallet'

export const PIN_RESET_CODE_LENGTH = 6

const pin = (label: string) => z.string().regex(new RegExp(`^\\d{${WALLET_PIN_LENGTH}}$`), `${label} must be ${WALLET_PIN_LENGTH} digits.`)

/** Set PIN and reset PIN: a new PIN typed twice (sink's pinSchema). */
export const newPinSchema = z.object({ pin: pin('Your new PIN'), confirm: z.string() })
  .refine(values => values.pin === values.confirm, { message: 'The two PINs do not match.', path: ['confirm'] })

/** Change PIN (sink's changePinSchema, plus confirming the new PIN). */
export const changePinSchema = z.object({ current: pin('Your current PIN'), pin: pin('Your new PIN'), confirm: z.string() })
  .refine(values => values.pin === values.confirm, { message: 'The two new PINs do not match.', path: ['confirm'] })
  .refine(values => values.pin !== values.current, { message: 'Choose a PIN that is different from your current one.', path: ['pin'] })

/** The emailed reset code (Swagger: ChangePinTokenVerification.token, 6 digits). */
export const resetCodeSchema = z.string().regex(new RegExp(`^\\d{${PIN_RESET_CODE_LENGTH}}$`), `Enter the ${PIN_RESET_CODE_LENGTH}-digit code from your email.`)

/** The first validation message, or '' when the values are valid. */
export const firstIssue = (result: { success: boolean; error?: z.ZodError }) => (result.success ? '' : result.error?.issues[0]?.message ?? 'Check your entries.')
