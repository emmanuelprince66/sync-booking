import { cn } from '@/lib/cn'

/** The design's switch. */
export function Toggle({ enabled, onChange, label, disabled }: { enabled: boolean; onChange: (enabled: boolean) => void; label?: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={label} disabled={disabled} onClick={() => onChange(!enabled)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50', enabled ? 'bg-[#329661]' : 'bg-[#D9E0DC]')}>
    <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white transition-all', enabled ? 'left-6' : 'left-1')}/>
  </button>
}
