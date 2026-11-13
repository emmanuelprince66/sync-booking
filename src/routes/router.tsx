import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { GuestOnly, RequireArea, RequireAuth, RequireBusiness } from './guards'
import { pages } from './pages'
import { paths } from './paths'
import { AvailabilityRedirect, BranchDetailRedirect, BranchesRedirect, StorefrontRedirect, TeamRedirect } from './redirects'

const { AuthPage, SelectBusinessPage, OverviewPage, CalendarPage, BookingsPage, WalletPage, ClientsPage, ClientDetailPage, ServicesPage, CategoriesPage, SettingsPage, KycPage } = pages

export const router = createBrowserRouter([
  {
    element: <GuestOnly/>,
    children: [
      { path: paths.login, element: <AuthPage/> },
      { path: paths.signup, element: <AuthPage/> },
    ],
  },
  // Onboarding steps after signup: the user is already signed in by then.
  { path: `${paths.signup}/:step`, element: <Suspense fallback={<AppLoader/>}><AuthPage/></Suspense> },
  {
    element: <RequireAuth/>,
    children: [
      { path: paths.selectBusiness, element: <SelectBusinessPage/> },
      {
        element: <RequireBusiness/>,
        children: [
      {
        element: <AppLayout/>,
        children: [
          // Overview is open to every role (a refused page lands there). The rest are decided by the login's
          // permissions (lib/access-map.ts); what each role sees inside is decided by usePermissions.
          { index: true, element: <OverviewPage/> },
          { element: <RequireArea area="calendar"/>, children: [{ path: paths.calendar, element: <CalendarPage/> }] },
          { element: <RequireArea area="bookings"/>, children: [{ path: paths.bookings, element: <BookingsPage/> }] },
          { element: <RequireArea area="wallet"/>, children: [{ path: paths.wallet, element: <WalletPage/> }] },
          { element: <RequireArea area="clients"/>, children: [{ path: paths.clients, element: <ClientsPage/> }, { path: paths.clientDetail, element: <ClientDetailPage/> }] },
          { element: <RequireArea area="services"/>, children: [{ path: paths.services, element: <ServicesPage/> }] },
          // Availability is a tab of Services now (the tab itself is Super admin only).
          { path: paths.availability, element: <AvailabilityRedirect/> },
          // Refused logins are sent to Overview with a toast.
          { element: <RequireArea area="categories"/>, children: [{ path: paths.serviceCategories, element: <CategoriesPage/> }] },
          {
            element: <RequireArea area="settings"/>,
            children: [
              // Team, Branches and Storefront are tabs of Setup.
              { path: paths.storefront, element: <StorefrontRedirect/> },
              { path: paths.settings, element: <SettingsPage/> },
              { path: paths.team, element: <TeamRedirect/> },
              { path: paths.branches, element: <BranchesRedirect/> },
              { path: paths.branchDetail, element: <BranchDetailRedirect/> },
            ],
          },
          { element: <RequireArea area="kyc"/>, children: [{ path: paths.kyc, element: <KycPage/> }] },
        ],
      },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
