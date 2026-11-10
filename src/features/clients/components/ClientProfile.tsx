import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InitialsTile } from '@/components/ui/misc'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { ClientDetailModel } from '../hooks/useClientDetail'

const cardLabel = 'text-[10px] font-black uppercase tracking-[0.12em] text-[#8A9C93]'

/** Dark summary band: who they are and the figures that matter. Holds the page's one title. */
export function ClientHeader({ detail }: { detail: ClientDetailModel }) {
  const { header, client } = detail
  if (!header || !client) return null
  return <section className="rounded-2xl bg-[#173A2E] p-5 text-white md:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <InitialsTile initials={header.initials} color={header.color} className="h-14 w-14 rounded-2xl text-lg"/>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-black tracking-tight">{header.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-white/60">
            {header.status && <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-extrabold', header.statusClassName)}>{header.status}</span>}
            {header.meta && <span>{header.meta}</span>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button variant="outline" onClick={detail.openEdit} className="h-10 border-white/20 bg-white/5 text-white hover:border-white/40 hover:text-white"><Pencil size={15}/> Edit</Button>
        <Button variant="outline" onClick={() => detail.remove.ask(client)} className="h-10 border-white/20 bg-white/5 text-[#FFB4A8] hover:border-[#FFB4A8] hover:text-[#FFB4A8]"><Trash2 size={15}/> Delete</Button>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {detail.stats.map(stat => <div key={stat.label} className="rounded-xl bg-white/[0.07] px-3 py-3">
        <p className="text-lg font-black">{stat.value}</p>
        <p className="mt-0.5 text-[11px] font-bold text-white/55">{stat.label}</p>
      </div>)}
      {header.churnRisk && <div className="rounded-xl bg-white/[0.07] px-3 py-3">
        <p className="text-lg font-black text-[#D8FF72]">{header.churnRisk}</p>
        <p className="mt-0.5 text-[11px] font-bold text-white/55">Churn risk</p>
      </div>}
    </div>
  </section>
}

/** Contact and profile details (sink's Identity panel). */
export function ClientInfoCard({ detail }: { detail: ClientDetailModel }) {
  return <section className="rounded-2xl border border-border bg-white p-5">
    <p className={cardLabel}>Client details</p>
    <dl className="mt-4 flex flex-col gap-3">
      {detail.info.map(item => <div key={item.label} className="flex flex-col gap-0.5">
        <dt className="text-[11px] font-bold text-[#8A9C93]">{item.label}</dt>
        <dd className="break-words text-sm font-extrabold text-[#29483B]">{item.href ? <a href={item.href} className="text-[#24764F] hover:underline">{item.value}</a> : item.value}</dd>
      </div>)}
    </dl>
  </section>
}

/** Sink's customer journey: milestones without a date are dimmed, since the gap says something too. */
export function ClientJourneyCard({ detail }: { detail: ClientDetailModel }) {
  return <section className="rounded-2xl border border-border bg-white p-5">
    <p className={cardLabel}>Client journey</p>
    <ol className="relative mt-4 flex flex-col gap-4 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
      {detail.journey.map(step => <li key={step.label} className={cn('relative flex items-start gap-3', !step.date && 'opacity-45')}>
        <span className={cn('z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-4 border-white', step.date ? 'bg-[#329661]' : 'bg-[#D7E1DB]')}/>
        <div><p className="text-sm font-extrabold text-[#29483B]">{step.label}</p><p className="text-xs font-semibold text-[#8A9C93]">{step.date || 'Not yet'}</p></div>
      </li>)}
    </ol>
  </section>
}

/** The page's shape while the profile loads. */
export function ClientDetailSkeleton() {
  return <SkeletonGroup label="Loading client" className="flex flex-col gap-6">
    <div className="rounded-2xl bg-[#173A2E] p-5 md:p-6">
      <div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-2xl bg-white/10"/><div className="flex flex-col gap-2"><Skeleton className="h-6 w-44 bg-white/10"/><Skeleton className="h-3 w-32 bg-white/10"/></div></div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 rounded-xl bg-white/10"/>)}</div>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Skeleton className="h-80 rounded-2xl"/>
      <div className="flex flex-col gap-6"><Skeleton className="h-72 rounded-2xl"/><Skeleton className="h-40 rounded-2xl"/></div>
    </div>
  </SkeletonGroup>
}
