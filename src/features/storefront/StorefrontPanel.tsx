import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState, SectionTitle } from '@/components/ui/misc'
import { StorefrontEditor } from './components/StorefrontEditor'
import { StorefrontSkeleton } from './components/StorefrontSkeleton'
import { useStorefrontPage } from './hooks/useStorefrontPage'

/** Setup → Storefront: the public booking page's look, details and policies. */
export function StorefrontPanel() {
  const page = useStorefrontPage()
  return <div className="min-w-0">
    <SectionTitle title="Storefront" subtitle="Make your booking page feel unmistakably yours." actions={page.bookingUrl
      ? <a href={page.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-extrabold text-[#3E584E] hover:text-[#173A2E]"><Eye size={16}/> View booking page</a>
      : <Button variant="outline" disabled><Eye size={16}/> View booking page</Button>}/>
    {page.isError && <ErrorState title="We couldn’t load your storefront" onRetry={page.retry}/>}
    {page.isLoading && <StorefrontSkeleton/>}
    {page.profile && <StorefrontEditor profile={page.profile} themes={page.themes}/>}
  </div>
}
