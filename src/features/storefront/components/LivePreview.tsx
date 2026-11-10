import { InitialsTile } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { StorefrontPreview } from '../hooks/useStorefrontEditor'

/** Phone-framed booking page that follows every section's draft: name, about, logo, cover and brand colour. */
export function LivePreview({ preview }: { preview: StorefrontPreview }) {
  return <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
    <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.13em] text-[#7D9188]">Live preview</p>
    <div className="mx-auto max-w-[390px] overflow-hidden rounded-[28px] border-[7px] border-[#173A2E] bg-white shadow-[0_22px_55px_rgba(23,58,46,0.18)]">
      <div className="relative h-28" style={{ backgroundColor: preview.surface }}>
        {preview.cover && <img src={preview.cover} alt="" className="absolute inset-0 h-full w-full object-cover"/>}
        {preview.tagline && <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 to-transparent p-3 pl-24"><p className="line-clamp-2 text-[11px] font-extrabold leading-tight text-white">{preview.tagline}</p></div>}
      </div>
      <div className="relative px-5 pb-6">
        <InitialsTile initials={preview.initial} image={preview.logo || undefined} color="bg-[#FFCA68]" className="relative -mt-8 h-16 w-16 rounded-2xl border-4 border-white text-xl"/>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0"><h3 className="break-words text-lg font-black text-[#173A2E]">{preview.name}</h3>{preview.location && <p className="mt-0.5 text-[11px] font-bold text-[#7B9086]">{preview.location}</p>}</div>
          <span className={cn('shrink-0 rounded-full px-2 py-1 text-[9px] font-black', preview.isOpen ? 'bg-[#E0F6E8] text-[#1B7547]' : 'bg-[#F1F5F0] text-[#657C71]')}>{preview.isOpen ? 'OPEN' : 'CLOSED'}</span>
        </div>
        {preview.about && <p className="mt-3 line-clamp-3 break-words text-xs font-semibold leading-relaxed text-[#647B70]">{preview.about}</p>}
        <div className="my-5 h-px bg-border"/>
        <p className="text-xs font-black text-[#173A2E]">Choose a service</p>
        <div className="mt-3 flex flex-col gap-2">
          {preview.isLoading && Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-[62px] rounded-xl"/>)}
          {!preview.isLoading && preview.services.length === 0 && <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11px] font-semibold text-[#8A9C93]">Your active services appear here.</p>}
          {preview.services.map(service => <div key={service.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <InitialsTile initials={service.initials} color={service.color} className="h-9 w-9 rounded-lg text-[9px]"/>
            <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-[#29483B]">{service.name}</p><p className="font-mono text-[9px] text-[#8A9C93]">{service.duration}</p></div>
            <p className="text-[10px] font-black" style={{ color: preview.primary }}>{service.price}</p>
          </div>)}
        </div>
        <button type="button" tabIndex={-1} className="mt-4 w-full rounded-xl py-3 text-xs font-black" style={{ backgroundColor: preview.primary, color: preview.onPrimary }}>Continue</button>
      </div>
    </div>
  </div>
}
