import type { InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  suffix?: string
  hint?: string
  error?: string
  /** Element rendered at the end of the input box (e.g. the password eye button). */
  endAdornment?: ReactNode
  /** Controlled usage: receives the raw string value. */
  onValueChange?: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

export const fieldLabelClass = 'mb-2 block text-sm font-extrabold text-[#29483B]'
export const fieldBoxClass = 'flex min-h-[46px] items-center rounded-xl border border-border bg-[#FBFCFA] px-3 transition focus-within:border-[#329661]'
export const fieldErrorClass = 'mt-1.5 block text-[11px] font-semibold text-[#C2483D]'

/**
 * Labelled text input from the design. Use it controlled (value + onValueChange)
 * or with react-hook-form (`{...register('name')}`).
 */
export function Field({ label, suffix, hint, error, endAdornment, onValueChange, onChange, className, type = 'text', id, name, ref, ...props }: FieldProps) {
  const inputId = id ?? (name ? `field-${name}` : undefined)
  return <label className={cn('block min-w-0', className)} htmlFor={inputId}>
    <span className={fieldLabelClass}>{label}</span>
    <span className={cn(fieldBoxClass, error && 'border-[#C2483D] focus-within:border-[#C2483D]')}>
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        onChange={event => { onChange?.(event); onValueChange?.(event.target.value) }}
        className="w-full min-w-0 flex-1 bg-transparent py-3 text-sm font-bold text-[#405B50] outline-none placeholder:font-semibold placeholder:text-[#9DAEA6]"
        {...props}
      />
      {suffix && <span className="ml-2 text-xs font-bold text-[#81948B]">{suffix}</span>}
      {endAdornment}
    </span>
    {error
      ? <span role="alert" className={fieldErrorClass}>{error}</span>
      : hint && <span className="mt-1.5 block text-[11px] font-semibold text-[#8A9C93]">{hint}</span>}
  </label>
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; ref?: Ref<HTMLTextAreaElement> }

/** The design's multi-line input. `hint` is the small right-aligned counter under it. */
export function TextareaField({ label, error, hint, className, rows = 3, ref, ...props }: TextareaFieldProps) {
  return <label className={cn('block min-w-0', className)}>
    <span className={fieldLabelClass}>{label}</span>
    <textarea ref={ref} rows={rows} aria-invalid={error ? true : undefined} className="block w-full resize-none rounded-xl border border-border bg-[#FBFCFA] p-3 text-sm font-semibold leading-relaxed text-[#405B50] outline-none placeholder:text-[#9DAEA6] focus:border-[#329661]" {...props}/>
    {error ? <span role="alert" className={fieldErrorClass}>{error}</span> : hint && <span className="mt-1 block text-right font-mono text-[10px] text-[#94A59D]">{hint}</span>}
  </label>
}
