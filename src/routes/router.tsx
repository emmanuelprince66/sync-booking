import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { GuestOnly, RequireAuth, RequireBusiness } from './guards'
import { pages } from './pages'
import { paths } from './paths'

const { AuthPage, SelectBusinessPage, OverviewPage, CalendarPage, BookingsPage, ClientsPage, ClientDetailPage, ServicesPage, CategoriesPage, AvailabilityPage, StorefrontPage, SettingsPage, KycPage } = pages

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
          { index: true, element: <OverviewPage/> },
          { path: paths.calendar, element: <CalendarPage/> },
          { path: paths.bookings, element: <BookingsPage/> },
          { path: paths.clients, element: <ClientsPage/> },
          { path: paths.clientDetail, element: <ClientDetailPage/> },
          { path: paths.services, element: <ServicesPage/> },
          { path: paths.serviceCategories, element: <CategoriesPage/> },
          { path: paths.availability, element: <AvailabilityPage/> },
          { path: paths.storefront, element: <StorefrontPage/> },
          { path: paths.settings, element: <SettingsPage/> },
          { path: paths.kyc, element: <KycPage/> },
        ],
      },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
