import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Base shimmer block. Size it with classes, e.g. <Skeleton className="h-4 w-24"/>. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-[#E8EFEA]', className)}/>
}

/** Wrapper that announces loading to screen readers once. */
export function SkeletonGroup({ label = 'Loading', className, children }: { label?: string; className?: string; children: ReactNode }) {
  return <div role="status" aria-label={label} aria-busy="true" className={className}>{children}</div>
}

/** Matches <StatCard/>. */
export function StatCardSkeleton() {
  return <div className="rounded-2xl border border-[#E2EAE5] bg-white p-5 shadow-[0_8px_28px_rgba(18,52,39,.035)]">
    <div className="flex items-start justify-between"><Skeleton className="h-10 w-10 rounded-xl"/><Skeleton className="h-5 w-14 rounded-full"/></div>
    <Skeleton className="mt-5 h-7 w-24"/>
    <Skeleton className="mt-2 h-3 w-28"/>
  </div>
}

/** A row of stat card skeletons; pass the same grid classes as the real row. */
export function StatCardsSkeleton({ count, className }: { count: number; className: string }) {
  return <SkeletonGroup label="Loading stats" className={className}>{Array.from({ length: count }, (_, index) => <StatCardSkeleton key={index}/>)}</SkeletonGroup>
}

/** Product/item card with image area (items grid, storefront, catalog picker). */
export function MediaCardSkeleton({ imageClassName = 'h-40', rounded = 'rounded-2xl' }: { imageClassName?: string; rounded?: string }) {
  return <div className={cn('overflow-hidden border border-[#E0E8E3] bg-white', rounded)}>
    <Skeleton className={cn('w-full rounded-none', imageClassName)}/>
    <div className="space-y-2.5 p-4"><Skeleton className="h-3.5 w-3/4"/><div className="flex justify-between"><Skeleton className="h-3 w-12"/><Skeleton className="h-3 w-16"/></div></div>
  </div>
}

export function MediaCardGridSkeleton({ count = 6, className, imageClassName, rounded }: { count?: number; className: string; imageClassName?: string; rounded?: string }) {
  return <SkeletonGroup label="Loading items" className={className}>{Array.from({ length: count }, (_, index) => <MediaCardSkeleton key={index} imageClassName={imageClassName} rounded={rounded}/>)}</SkeletonGroup>
}

/** Icon + two lines + trailing value; used for transactions, partners, employees. */
export function ListRowSkeleton({ className = 'flex items-center gap-4 border-b border-[#EDF1EF] py-4 last:border-0' }: { className?: string }) {
  return <div className={className}>
    <Skeleton className="h-9 w-9 shrink-0 rounded-xl"/>
    <div className="flex-1 space-y-2"><Skeleton className="h-3 w-40 max-w-full"/><Skeleton className="h-2.5 w-20"/></div>
    <Skeleton className="h-3 w-16"/>
  </div>
}

export function ListSkeleton({ rows = 4, rowClassName, className }: { rows?: number; rowClassName?: string; className?: string }) {
  return <SkeletonGroup className={className}>{Array.from({ length: rows }, (_, index) => <ListRowSkeleton key={index} className={rowClassName}/>)}</SkeletonGroup>
}

/** Generic content card: title, subtitle and a few lines. */
export function CardSkeleton({ className = 'rounded-2xl border border-[#E2EAE5] bg-white p-5', lines = 3 }: { className?: string; lines?: number }) {
  return <div className={className} aria-hidden="true">
    <Skeleton className="h-4 w-32"/>
    <Skeleton className="mt-2 h-3 w-48 max-w-full"/>
    <div className="mt-5 space-y-3">{Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}/>)}</div>
  </div>
}

/** Route-level fallback inside the shell: the shape of a screen, never a blank area. */
export function PageSkeleton() {
  return <SkeletonGroup label="Loading page" className="mx-auto flex max-w-[1192px] flex-col gap-6 p-5 md:p-8">
    <div className="flex flex-col gap-2"><Skeleton className="h-8 w-48"/><Skeleton className="h-4 w-64 max-w-full"/></div>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl"/>)}</div>
    <Skeleton className="h-72 rounded-2xl"/>
  </SkeletonGroup>
}
