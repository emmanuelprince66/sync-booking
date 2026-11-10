import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { FormEventHandler, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Classes for the white panel, copied from the design. */
  panelClassName: string
  /** Overlay tint/blur/padding. Defaults to the design's modal overlay. */
  overlayClassName?: string
  /** "center" for dialogs, "right" for side drawers. */
  placement?: 'center' | 'right' | 'left'
  /** Accessible name. Pass it when the dialog has no <ModalHeader> (which provides one). */
  title?: string
}

/** On touch screens focusing the first field would pop the keyboard as the dialog opens, so the panel takes focus instead. */
const focusForDevice = (event: Event) => {
  if (!window.matchMedia('(pointer: coarse)').matches) return
  event.preventDefault()
  const panel = event.currentTarget as HTMLElement
  panel.focus()
}

/**
 * Accessible dialog (Radix: focus trap, Escape, scroll lock, portal) with the
 * design's overlay. Closes on backdrop click. Use <Drawer> for the right-hand panel.
 */
export function Modal({ open, onClose, children, panelClassName, overlayClassName = 'bg-[#071C14]/55 p-4 backdrop-blur-sm', placement = 'center', title }: ModalProps) {
  return <Dialog.Root open={open} onOpenChange={next => { if (!next) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className={cn('fixed inset-0 z-50 flex', placement === 'center' ? 'items-center justify-center' : placement === 'left' ? 'justify-start' : 'justify-end', overlayClassName)}>
        <Dialog.Content aria-describedby={undefined} onOpenAutoFocus={focusForDevice} className={cn('outline-none', panelClassName)}>
          {title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}
          {children}
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
}

/** Right-hand drawer (booking details). */
export function Drawer({ panelClassName = 'h-full w-full max-w-[500px] overflow-y-auto bg-[#F7F9F5] shadow-2xl', overlayClassName = 'bg-[#071C14]/45 backdrop-blur-sm', ...props }: Omit<ModalProps, 'placement' | 'panelClassName'> & { panelClassName?: string }) {
  return <Modal {...props} placement="right" panelClassName={panelClassName} overlayClassName={overlayClassName}/>
}

/** Small uppercase label + title + close button at the top of the design's dialogs. */
export function ModalHeader({ title, eyebrow, description, onClose, className }: {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  onClose?: () => void
  className?: string
}) {
  return <div className={cn('flex items-center justify-between gap-3 border-b border-border px-6 py-5', className)}>
    <div className="min-w-0">
      {eyebrow && <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#82988E]">{eyebrow}</p>}
      <Dialog.Title className="truncate text-xl font-black text-[#173A2E]">{title}</Dialog.Title>
      {description && <div className="mt-1 text-xs font-semibold text-[#8A9C93]">{description}</div>}
    </div>
    {onClose && <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F0F4F1] text-[#536B60]"><X size={18}/></button>}
  </div>
}

/** Right-aligned action row at the bottom of dialogs. */
export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex shrink-0 justify-end gap-2 border-t border-border bg-[#FAFBF9] px-6 py-4', className)}>{children}</div>
}

/**
 * The design's dialog: fixed header and footer around a scrolling body, so the
 * save button stays reachable on a phone whatever the form's height.
 */
export function FormModal({ open, onClose, title, eyebrow, description, footer, children, onSubmit, maxWidthClassName = 'max-w-[540px]', bodyClassName }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  footer: ReactNode
  children: ReactNode
  onSubmit?: FormEventHandler<HTMLFormElement>
  maxWidthClassName?: string
  bodyClassName?: string
}) {
  const inner = <>
    <div className={cn('min-h-0 flex-1 overflow-y-auto p-6', bodyClassName)}>{children}</div>
    <ModalFooter>{footer}</ModalFooter>
  </>
  return <Modal open={open} onClose={onClose} panelClassName={cn('flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl', maxWidthClassName)}>
    <ModalHeader title={title} eyebrow={eyebrow} description={description} onClose={onClose} className="shrink-0"/>
    {onSubmit ? <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">{inner}</form> : inner}
  </Modal>
}

/** "Are you sure?" dialog: the delete flows. */
export function ConfirmModal({ onClose, eyebrow, title, confirmLabel, cancelLabel, isConfirming, onConfirm, children }: {
  onClose: () => void
  eyebrow: ReactNode
  title: ReactNode
  confirmLabel: string
  cancelLabel: string
  isConfirming: boolean
  onConfirm: () => void
  children: ReactNode
}) {
  return <FormModal open onClose={onClose} eyebrow={eyebrow} title={title} footer={<>
    <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
    <Button variant="danger" loading={isConfirming} onClick={onConfirm}>{confirmLabel}</Button>
  </>}><p className="text-sm font-semibold leading-relaxed text-[#60796E]">{children}</p></FormModal>
}

/** For dialogs whose title isn't in a ModalHeader (e.g. custom header layouts). */
export const ModalTitle = Dialog.Title
