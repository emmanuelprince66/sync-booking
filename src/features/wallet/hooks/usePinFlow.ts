import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useChangeWalletPin, useRequestPinReset, useResetWalletPin, useSetWalletPin, useVerifyPinResetCode, WALLET_PIN_LENGTH } from '@/api/wallet'
import { useResendTimer } from '@/hooks/useResendTimer'
import { useAuthStore } from '@/stores/auth-store'
import { changePinSchema, firstIssue, newPinSchema, PIN_RESET_CODE_LENGTH, resetCodeSchema } from '../schemas'

/** Where the dialog opens: create a first PIN, change it, or the "Forgot PIN?" reset. */
export type PinMode = 'set' | 'change' | 'forgot'
export type PinStep = 'set' | 'change' | 'request' | 'verify' | 'reset'

const RESEND_SECONDS = 60
const FIRST_STEP: Record<PinMode, PinStep> = { set: 'set', change: 'change', forgot: 'request' }

const TITLES: Record<PinStep, string> = {
  set: 'Set transaction PIN',
  change: 'Change transaction PIN',
  request: 'Forgot PIN',
  verify: 'Enter the code',
  reset: 'Choose a new PIN',
}

/**
 * sink-inventory's wallet PIN screens (settings/pin: Pin, ChangePin, ForgetPin) as one
 * dialog. Forgot PIN: email a code (GET request_reset_pin_email) → verify it
 * (POST verify_pin_reset_code → uid64) → set the new PIN (PATCH reset_pin { uid64, pin }).
 * Mounted only while open, so closing throws the typed PINs away.
 */
export function usePinFlow({ mode, onClose }: { mode: PinMode; onClose: () => void }) {
  const email = useAuthStore(state => state.user?.email ?? '')
  const [step, setStep] = useState<PinStep>(FIRST_STEP[mode])
  const [current, setCurrent] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [uid64, setUid64] = useState('')
  const [error, setError] = useState('')
  const timer = useResendTimer(0)

  const createPin = useSetWalletPin()
  const changePin = useChangeWalletPin()
  const requestReset = useRequestPinReset()
  const verifyCode = useVerifyPinResetCode()
  const resetPin = useResetWalletPin()

  const goTo = (next: PinStep) => { setError(''); setStep(next) }
  const clearNewPin = () => { setPin(''); setConfirm('') }
  const edit = (setter: (value: string) => void) => (value: string) => { setter(value); setError('') }

  const submitSet = () => {
    const issue = firstIssue(newPinSchema.safeParse({ pin, confirm }))
    if (issue) return setError(issue)
    createPin.mutate(pin, {
      onSuccess: () => { toast.success('Transaction PIN set'); onClose() },
      onError: failure => setError(errorMessage(failure, 'Could not set your PIN. Try again.')),
    })
  }

  const submitChange = () => {
    const issue = firstIssue(changePinSchema.safeParse({ current, pin, confirm }))
    if (issue) return setError(issue)
    changePin.mutate({ oldPin: current, newPin: pin }, {
      onSuccess: () => { toast.success('Transaction PIN changed'); onClose() },
      onError: failure => { setCurrent(''); setError(errorMessage(failure, 'Could not change your PIN. Try again.')) },
    })
  }

  const sendCode = (onSent?: () => void) => requestReset.mutate(undefined, {
    onSuccess: () => { toast.success(email ? `Code sent to ${email}` : 'Code sent to your email'); timer.restart(RESEND_SECONDS); onSent?.() },
    onError: failure => setError(errorMessage(failure, 'Could not send the code. Try again.')),
  })

  const submitCode = () => {
    const issue = firstIssue(resetCodeSchema.safeParse(code))
    if (issue) return setError(issue)
    verifyCode.mutate(code, {
      onSuccess: id => { setUid64(id); clearNewPin(); goTo('reset') },
      onError: failure => { setCode(''); setError(errorMessage(failure, 'That code is invalid or has expired.')) },
    })
  }

  const submitReset = () => {
    const issue = firstIssue(newPinSchema.safeParse({ pin, confirm }))
    if (issue) return setError(issue)
    resetPin.mutate({ uid64, pin }, {
      onSuccess: () => { toast.success('Transaction PIN reset'); onClose() },
      onError: failure => setError(errorMessage(failure, 'Could not reset your PIN. Try again.')),
    })
  }

  const busy = createPin.isPending || changePin.isPending || requestReset.isPending || verifyCode.isPending || resetPin.isPending

  /** One step back; leaving the first step closes the dialog. */
  const back = () => {
    if (step === 'reset') { clearNewPin(); return goTo('verify') }
    if (step === 'verify') { setCode(''); return goTo('request') }
    if (step === 'request' && mode === 'change') { clearNewPin(); return goTo('change') }
    onClose()
  }

  const backLabel = step === 'reset' ? 'Back to code' : step === 'verify' ? 'Back' : step === 'request' && mode === 'change' ? 'Back to change PIN' : ''

  const primary = {
    set: { label: 'Save PIN', submit: submitSet, ready: pin.length === WALLET_PIN_LENGTH && confirm.length === WALLET_PIN_LENGTH, loading: createPin.isPending },
    change: { label: 'Update PIN', submit: submitChange, ready: current.length === WALLET_PIN_LENGTH && pin.length === WALLET_PIN_LENGTH && confirm.length === WALLET_PIN_LENGTH, loading: changePin.isPending },
    request: { label: 'Send code', submit: () => sendCode(() => { setCode(''); goTo('verify') }), ready: true, loading: requestReset.isPending },
    verify: { label: 'Verify code', submit: submitCode, ready: code.length === PIN_RESET_CODE_LENGTH, loading: verifyCode.isPending },
    reset: { label: 'Reset PIN', submit: submitReset, ready: pin.length === WALLET_PIN_LENGTH && confirm.length === WALLET_PIN_LENGTH, loading: resetPin.isPending },
  }[step]

  return {
    step,
    title: TITLES[step],
    email,
    error,
    busy,
    close: onClose,
    back,
    backLabel,
    current, setCurrent: edit(setCurrent),
    pin, setPin: edit(setPin),
    confirm, setConfirm: edit(setConfirm),
    code, setCode: edit(setCode),
    forgot: () => { clearNewPin(); setCurrent(''); goTo('request') },
    resend: {
      available: timer.canResend && !requestReset.isPending,
      sending: requestReset.isPending && step === 'verify',
      label: timer.label,
      send: () => { setCode(''); setError(''); sendCode() },
    },
    primary,
  }
}

export type PinFlow = ReturnType<typeof usePinFlow>
