import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'

export function CustomDomainPromptModal({ open, onClose, onUpgrade }: { open: boolean; onClose: () => void; onUpgrade: () => void }) {
  return <Modal open={open} onClose={onClose} panelClassName="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-[0_25px_80px_rgba(7,28,20,.24)]">
    <ModalHeader title="Get your own domain" description="Your business deserves a .com or .ng clients can trust and remember." onClose={onClose}/>
    <div className="p-6">
      <div className="rounded-2xl bg-[#F3F7F4] p-4">
        <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#82958C]">Your booking page address</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-[#5F7268]">
          <span className="break-all">store.sync360.africa/yourbusiness/services</span>
          <ArrowRight size={14}/>
          <span className="break-all text-[#24764F]">book.yourbusiness.com</span>
        </div>
      </div>
      <h2 className="mt-5 text-xs font-black text-[#29483B]">Why upgrade?</h2>
      <ul className="mt-3 space-y-3">
        {[
          ['Professional', 'A branded booking address helps clients trust your business.'],
          ['Easy to remember', 'Clients can find your booking page again more easily.'],
          ['Your brand', 'Use your business name instead of a shared store link.'],
        ].map(([title, description]) => <li key={title} className="flex items-start gap-2.5 text-[11px] font-semibold leading-5 text-[#6C7E75]">
          <span className="mt-0.5 shrink-0 text-[#329661]"><Check size={15}/></span>
          <span><strong className="text-[#405B50]">{title}</strong> — {description}</span>
        </li>)}
      </ul>
    </div>
    <ModalFooter className="grid grid-cols-2">
      <Button variant="ghost" onClick={onClose} className="w-full">Maybe later</Button>
      <Button onClick={onUpgrade} className="w-full">Upgrade</Button>
    </ModalFooter>
  </Modal>
}
