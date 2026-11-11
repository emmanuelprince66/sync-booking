import { useId, type ReactNode } from 'react'
import { fieldBoxClass, fieldErrorClass, fieldLabelClass } from '@/components/ui/Field'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { cn } from '@/lib/cn'
import { usePhoneField } from '../hooks/usePhoneField'

type PhoneFieldProps = {
  label: ReactNode
  name: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
}

/** Phone number with a country-code picker (Nigeria by default). The value is the full international number. */
export function PhoneField({ label, name, value, onChange, onBlur, placeholder = 'Enter phone number', error }: PhoneFieldProps) {
  const inputId = useId()
  const { countries, country, national, onCountryChange, onNationalChange } = usePhoneField({ value, onChange })
  return <div className="block min-w-0">
    <label htmlFor={inputId} className={fieldLabelClass}>{label}</label>
    <div className="flex gap-2">
      <OptionSelect aria-label="Country code" options={countries} value={country} onValueChange={onCountryChange} searchable className="w-[148px] shrink-0" boxClassName={cn(error && 'border-[#C2483D]')}/>
      <span className={cn(fieldBoxClass, 'min-w-0 flex-1', error && 'border-[#C2483D] focus-within:border-[#C2483D]')}>
        <input id={inputId} name={name} type="tel" inputMode="tel" autoComplete="tel-national" value={national} placeholder={placeholder} aria-invalid={error ? true : undefined}
          onChange={event => onNationalChange(event.target.value)} onBlur={onBlur}
          className="w-full min-w-0 flex-1 bg-transparent py-3 text-sm font-bold text-[#405B50] outline-none placeholder:font-semibold placeholder:text-[#9DAEA6]"/>
      </span>
    </div>
    {error && <span role="alert" className={fieldErrorClass}>{error}</span>}
  </div>
}
