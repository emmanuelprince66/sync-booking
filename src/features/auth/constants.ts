import type { IconName } from '@/components/ui/Icon'

export type AuthStage = 'access' | 'otp' | 'business' | 'kyc'
export type AccessMode = 'login' | 'signup'

/** Onboarding stages shown in the "Account setup · Step x of 3" bar. */
export const SETUP_STAGES: AuthStage[] = ['otp', 'business', 'kyc']

/** URL segment after /signup/ → stage. */
export const STEP_TO_STAGE: Record<string, AuthStage> = { verify: 'otp', business: 'business', kyc: 'kyc' }

export const OTP_LENGTH = 6
export const RESEND_SECONDS = 28
export const SLIDE_INTERVAL_MS = 4500

export const AUTH_SLIDES: { label: string; title: string; text: string; icon: IconName }[] = [
  { label: 'Your booking page', title: 'Get booked from one simple link.', text: 'Clients pick a service, choose a time and pay without sending a message.', icon: 'link' },
  { label: 'Calendar & availability', title: 'Set your rhythm. We handle the slots.', text: 'Weekly hours, breaks and blocked time keep your day exactly how you want it.', icon: 'clock' },
  { label: 'Payments & deposits', title: 'Fewer no-shows, faster payouts.', text: 'Take full payments or deposits at booking, and collect the rest on arrival.', icon: 'card' },
]

/** The time slots lighting up one by one on the brand panel. */
export const AUTH_TIMES = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30']

export const KYC_BENEFITS = ['Higher withdrawal limits', 'Verified booking page badge', 'Priority payment settlements']
