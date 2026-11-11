import { AlertCircle } from 'lucide-react'
import { WALLET_PIN_LENGTH } from '@/api/wallet'
import { OtpInput } from '@/components/ui/OtpInput'

/** A failed step's message, inside the wallet dialogs. */
export function ErrorNote({ message }: { message: string }) {
  return message ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#FDECEA] px-3 py-2.5 text-xs font-bold text-[#B23F35]"><AlertCircle size={15} className="mt-px shrink-0"/>{message}</p> : null
}

/** The four masked wallet PIN boxes. */
export function PinInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <OtpInput value={value} onChange={onChange} length={WALLET_PIN_LENGTH} label={label} masked className="mx-auto mt-3 flex max-w-[260px] gap-2 sm:gap-3"/>
}
