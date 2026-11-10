import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'

/** The editor's shape while the business profile loads: tab strip, a section, and the phone preview. */
export function StorefrontSkeleton() {
  return <SkeletonGroup label="Loading storefront" className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="min-w-0 rounded-2xl border border-border bg-white">
      <div className="flex gap-4 overflow-hidden border-b border-border px-5 py-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-4 w-20 shrink-0"/>)}</div>
      <div className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-start gap-3"><Skeleton className="h-10 w-10 rounded-xl"/><div className="flex flex-col gap-2"><Skeleton className="h-4 w-32"/><Skeleton className="h-3 w-56 max-w-full"/></div></div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="flex flex-col gap-3"><Skeleton className="h-12 rounded-xl"/><div className="grid grid-cols-3 gap-2"><Skeleton className="h-10 rounded-xl"/><Skeleton className="h-10 rounded-xl"/><Skeleton className="h-10 rounded-xl"/></div></div>
          <Skeleton className="h-48 rounded-2xl"/>
        </div>
        <Skeleton className="h-20 rounded-2xl"/>
      </div>
    </div>
    <Skeleton className="mx-auto h-[520px] w-full max-w-[390px] rounded-[28px]"/>
  </SkeletonGroup>
}
