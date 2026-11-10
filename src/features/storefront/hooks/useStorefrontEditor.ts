import { useState } from 'react'
import { useSchedule } from '@/api/availability'
import { useAllServices } from '@/api/services'
import type { StorefrontProfile, StoreTheme } from '@/api/storefront'
import { serviceColor } from '@/features/bookings/utils'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { durationLong, timeToMinutes, weekdayIndex } from '@/lib/dates'
import { initials } from '@/lib/format'
import { useBranding } from './useBranding'
import { usePolicies } from './usePolicies'
import { useStoreDays } from './useStoreDays'
import { useStoreDetailsForm } from './useStoreDetailsForm'
import { useStoreLink } from './useStoreLink'

export const STOREFRONT_TABS = ['Booking link', 'Branding', 'Details & contact', 'Opening days', 'Policies', 'Payments'] as const
export type StorefrontTab = typeof STOREFRONT_TABS[number]

const PREVIEW_SERVICES = 3

/**
 * Every storefront section, each saving on its own (SyncShip's storefront settings), held here so
 * drafts survive switching tabs and the live preview follows them as they are edited.
 */
export function useStorefrontEditor(profile: StorefrontProfile, themes: StoreTheme[]) {
  const money = useFormatMoney()
  const scheduleQuery = useSchedule()
  const servicesQuery = useAllServices()
  const [tab, setTab] = useState<StorefrontTab>(STOREFRONT_TABS[0])
  const link = useStoreLink(profile)
  const branding = useBranding(profile, themes)
  const details = useStoreDetailsForm(profile)
  const days = useStoreDays(profile)
  const policies = usePolicies()

  const draft = details.watched
  const name = draft.name ?? ''
  const today = scheduleQuery.data?.find(day => day.dayOfWeek === weekdayIndex(new Date()))
  const now = new Date().getHours() * 60 + new Date().getMinutes()
  const isOpen = Boolean(today && !today.isClosed && now >= timeToMinutes(today.openTime) && now < timeToMinutes(today.closeTime))
  const theme = branding.activeTheme
  const services = (servicesQuery.data?.services ?? []).filter(service => service.isActive).slice(0, PREVIEW_SERVICES)

  return {
    tab,
    setTab,
    tabs: STOREFRONT_TABS,
    /** Every tab after the first is a sub-view of the booking link. */
    subView: tab === STOREFRONT_TABS[0] ? null : { backLabel: `Back to ${STOREFRONT_TABS[0].toLowerCase()}`, goBack: () => setTab(STOREFRONT_TABS[0]) },
    unsaved: { Branding: branding.dirty, 'Details & contact': details.dirty, 'Opening days': days.dirty, Policies: policies.dirty } as Partial<Record<StorefrontTab, boolean>>,
    link,
    branding,
    details,
    days,
    policies,
    preview: {
      name: name || 'Your business',
      initial: (name || 'B').charAt(0).toUpperCase(),
      logo: branding.logo,
      cover: branding.banners[0]?.url ?? '',
      tagline: draft.tagline ?? '',
      about: draft.description ?? '',
      location: [draft.city, draft.state].filter(Boolean).join(', '),
      isOpen,
      primary: theme?.primary ?? '#173A2E',
      onPrimary: theme?.onPrimary ?? '#FFFFFF',
      surface: theme?.surface ?? '#F1F5F0',
      isLoading: servicesQuery.isLoading,
      services: services.map((service, index) => ({ id: service.id, name: service.name, duration: durationLong(service.duration), price: money(service.amount), initials: initials(service.name), color: serviceColor(index) })),
    },
  }
}

export type StorefrontEditorModel = ReturnType<typeof useStorefrontEditor>
export type StorefrontPreview = StorefrontEditorModel['preview']
