import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState, PageTitle } from '@/components/ui/misc'
import { StorefrontEditor } from './components/StorefrontEditor'
import { StorefrontSkeleton } from './components/StorefrontSkeleton'
import { useStorefrontPage } from './hooks/useStorefrontPage'

export default function StorefrontPage() {
  const page = useStorefrontPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Storefront" subtitle="Make your booking page feel unmistakably yours." actions={page.bookingUrl
      ? <a href={page.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-extrabold text-[#3E584E] hover:text-[#173A2E]"><Eye size={16}/> View booking page</a>
      : <Button variant="outline" disabled><Eye size={16}/> View booking page</Button>}/>
    {page.isError && <ErrorState title="We couldn’t load your storefront" onRetry={page.retry}/>}
    {page.isLoading && <StorefrontSkeleton/>}
    {page.profile && <StorefrontEditor profile={page.profile} themes={page.themes}/>}
  </div>
}
