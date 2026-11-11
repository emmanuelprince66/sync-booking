import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  /** Accessible name prefix for each box, e.g. "PIN digit". */
  label?: string
  /** Hide the digits (transaction PINs). */
  masked?: boolean
  className?: string
}

/** Six-box numeric code input from the design: auto-advance, backspace to previous, paste fills all. */
export function OtpInput({ value, onChange, length = 6, label = 'OTP digit', masked = false, className = 'mt-8 flex gap-2 sm:gap-3' }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  const setDigit = (index: number, digit: string) => {
    const next = [...digits]
    next[index] = digit
    onChange(next.join('').slice(0, length))
    if (digit && index < length - 1) inputs.current[index + 1]?.focus()
  }

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    inputs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return <div className={className}>
    {digits.map((digit, index) => <input
      key={index}
      ref={element => { inputs.current[index] = element }}
      aria-label={`${label} ${index + 1}`}
      type={masked ? 'password' : 'text'}
      inputMode="numeric"
      autoComplete={masked ? 'off' : index === 0 ? 'one-time-code' : 'off'}
      maxLength={1}
      value={digit}
      onChange={event => setDigit(index, event.target.value.replace(/\D/g, '').slice(-1))}
      onKeyDown={onKeyDown(index)}
      onPaste={onPaste}
      className="h-14 min-w-0 flex-1 rounded-xl border border-[#D9E4DD] bg-[#FAFCFA] text-center text-xl font-black text-[#173A2E] outline-none focus:border-[#329661] focus:ring-4 focus:ring-[#329661]/10"
    />)}
  </div>
}
