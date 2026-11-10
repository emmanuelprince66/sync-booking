import { Check, X } from 'lucide-react'
import { Toaster } from 'sonner'

const toastClass = 'flex w-full items-center gap-3 rounded-2xl bg-[#173A2E] px-4 py-3 font-sans text-sm font-extrabold text-white shadow-2xl'

/** The design's dark toast, bottom right. */
export function AppToaster() {
  return <Toaster
    position="bottom-right"
    icons={{
      success: <span className="grid h-6 w-6 place-items-center rounded-full bg-[#D8FF72] text-[#173A2E]"><Check size={14} strokeWidth={3}/></span>,
      error: <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#C2483D]"><X size={14} strokeWidth={3}/></span>,
    }}
    toastOptions={{ unstyled: true, classNames: { toast: toastClass, error: '!bg-[#9A3B2F]', title: 'font-extrabold', icon: 'mr-1 !h-6 !w-6' } }}
  />
}
