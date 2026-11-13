import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { BookingDetailsDrawer } from '@/features/bookings/components/BookingDetailsDrawer'
import { NewBookingModal } from '@/features/bookings/components/NewBookingModal'
import { usePermissionsSync } from '@/hooks/usePermissionsSync'
import { useAppShell } from './hooks'
import { MobileSidebar, Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** The design's shell: sidebar, sticky top bar, content that scrolls with the page, and the app-wide booking dialogs. */
export function AppLayout() {
  const { newBookingOpen, hasSelectedBooking } = useAppShell()
  // Picks up permission changes the owner makes (sink: PermissionsSync).
  usePermissionsSync()
  return <div className="min-h-dvh bg-background font-sans text-foreground lg:flex">
    <Sidebar/>
    <MobileSidebar/>
    <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
      <Topbar/>
      <main className="min-w-0 flex-1">
        <Suspense fallback={<PageSkeleton/>}><Outlet/></Suspense>
      </main>
    </div>
    {newBookingOpen && <NewBookingModal/>}
    {hasSelectedBooking && <BookingDetailsDrawer/>}
  </div>
}
