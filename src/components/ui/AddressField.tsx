import { Check, MapPin } from 'lucide-react'
import { useAddressSearch } from '@/hooks/useAddressSearch'
import type { AddressSuggestion } from '@/lib/address'
import { cn } from '@/lib/cn'
import { fieldErrorClass, fieldLabelClass } from './Field'

type AddressFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
  /** A suggestion was picked and its location saved. */
  isPinned?: boolean
  error?: string
  placeholder?: string
}

/** Multi-line address box with search suggestions when address lookup is configured. */
export function AddressField({ label, value, onChange, onSelect, isPinned, error, placeholder }: AddressFieldProps) {
  const { rootRef, ...search } = useAddressSearch(value)
  return <div ref={rootRef} className="relative min-w-0">
    <label className={fieldLabelClass} htmlFor="address-field">{label}</label>
    <span className={cn('flex items-start gap-2 rounded-xl border border-border bg-[#FBFCFA] px-3 py-3 transition focus-within:border-[#329661]', error && 'border-[#C2483D]')}>
      <MapPin size={16} className="mt-0.5 shrink-0 text-[#82988E]"/>
      <textarea id="address-field" rows={2} value={value} placeholder={placeholder} aria-invalid={error ? true : undefined} autoComplete="street-address" onChange={event => { search.onType(); onChange(event.target.value) }} className="min-w-0 flex-1 resize-none bg-transparent text-sm font-bold text-[#405B50] outline-none placeholder:font-semibold placeholder:text-[#9DAEA6]"/>
      {isPinned && <span title="Location confirmed" className="mt-0.5 shrink-0 text-[#24764F]"><Check size={16} strokeWidth={2.6}/></span>}
    </span>
    {search.isOpen && <div role="listbox" className="absolute inset-x-0 z-20 mt-1 flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-[0_18px_44px_rgba(9,38,28,.16)]">
      {search.suggestions.length === 0 && <p className="px-3 py-3 text-xs font-semibold text-[#8A9C93]">{search.isSearching ? 'Searching…' : 'No matching addresses'}</p>}
      {search.suggestions.map(suggestion => <button key={suggestion.id} type="button" role="option" aria-selected={false} onClick={() => { onSelect(suggestion); search.close() }} className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-[#F3F7F4]">
        <MapPin size={15} className="mt-0.5 shrink-0 text-[#24764F]"/>
        <span className="min-w-0"><span className="block truncate text-xs font-bold text-[#173A2E]">{suggestion.address || suggestion.label}</span><span className="block truncate text-[10px] font-semibold text-[#8A9C93]">{[suggestion.city, suggestion.state].filter(Boolean).join(', ')}</span></span>
      </button>)}
    </div>}
    {error && <span role="alert" className={fieldErrorClass}>{error}</span>}
  </div>
}
