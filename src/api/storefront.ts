import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest, mockDelay } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useBusinessScope } from './business'
import { apiFormRequest, asRecord, isLive, listFrom, str } from './http'
import { queryKeys } from './query-keys'

/**
 * Booking page profile, from the business record (sink's store-info / e-setup screens, as ported to SyncShip):
 *  GET   business/{id}/              name, type, tag_line, description, contact, address, currency, store_theme,
 *                                    logo, banner(s), working_days, delivery_days, store_url, custom_domain, enable_bnpl…
 *  PATCH business/{id}/ (multipart)  any of those text fields, logo, banners + existing_banners, working_days, delivery_days
 *  PATCH business/{id}/ (JSON)       { enable_bnpl }
 *  GET   business/store_themes/      { default, themes: StoreTheme[] }
 */

// ─── Constants ──────────────────────────────────────────────────────────────

export const BUSINESS_SECTOR_OPTIONS = [
  'Salon Business', 'Beauty & Personal Care', 'Food & Restaurant', 'Book & Stationery', 'Minimart & Retail', 'Electronics & Gadget', 'Laundry',
  'Pharmacy & Health Products', 'Home & Furniture', 'Construction Material & Suppliers', 'Logistics & Others',
] as const

export const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'CNY', 'INR', 'JPY', 'CHF', 'NZD', 'RUB', 'BRL', 'MXN', 'SGD', 'HKD', 'SEK'] as const

export type StoreTheme = { key: string; label: string; primary: string; onPrimary: string; surface: string; accent: string }

/** Mirrors the backend's STORE_THEMES enum; also the fallback while the list loads. */
export const STORE_THEMES: StoreTheme[] = [
  { key: 'emerald', label: 'Emerald', primary: '#047857', onPrimary: '#FFFFFF', surface: '#ECFDF5', accent: '#10B981' },
  { key: 'royal', label: 'Royal Blue', primary: '#1D4ED8', onPrimary: '#FFFFFF', surface: '#EFF6FF', accent: '#3B82F6' },
  { key: 'plum', label: 'Plum', primary: '#7E22CE', onPrimary: '#FFFFFF', surface: '#FAF5FF', accent: '#A855F7' },
  { key: 'indigo', label: 'Indigo', primary: '#4338CA', onPrimary: '#FFFFFF', surface: '#EEF2FF', accent: '#6366F1' },
  { key: 'violet', label: 'Violet', primary: '#6D28D9', onPrimary: '#FFFFFF', surface: '#F5F3FF', accent: '#8B5CF6' },
  { key: 'rose', label: 'Rose', primary: '#BE123C', onPrimary: '#FFFFFF', surface: '#FFF1F2', accent: '#F43F5E' },
  { key: 'sunset', label: 'Sunset Orange', primary: '#C2410C', onPrimary: '#FFFFFF', surface: '#FFF7ED', accent: '#F97316' },
  { key: 'bronze', label: 'Bronze', primary: '#92400E', onPrimary: '#FFFFFF', surface: '#FFFBEB', accent: '#D97706' },
  { key: 'amber', label: 'Amber', primary: '#B45309', onPrimary: '#FFFFFF', surface: '#FFFBEB', accent: '#F59E0B' },
  { key: 'teal', label: 'Teal', primary: '#0F766E', onPrimary: '#FFFFFF', surface: '#F0FDFA', accent: '#14B8A6' },
  { key: 'charcoal', label: 'Charcoal', primary: '#334155', onPrimary: '#FFFFFF', surface: '#F8FAFC', accent: '#64748B' },
]
export const DEFAULT_THEME = STORE_THEMES[0]

/** Backend weekday enum, used by working_days and delivery_days. */
export const WEEK_DAYS = [
  { value: 'MONDAY', short: 'Mon' }, { value: 'TUESDAY', short: 'Tue' }, { value: 'WEDNESDAY', short: 'Wed' },
  { value: 'THURSDAY', short: 'Thu' }, { value: 'FRIDAY', short: 'Fri' }, { value: 'SATURDAY', short: 'Sat' }, { value: 'SUNDAY', short: 'Sun' },
] as const
export type WeekDay = typeof WEEK_DAYS[number]['value']

/** CNAME target merchants point a custom domain at. */
export const STORE_DNS_TARGET = 'store.sync360.africa'
export const MAX_BANNERS = 6
const PLATFORM_STORE_ORIGIN = 'https://store.sync360.africa'
const RESERVED_STOREFRONT_SEGMENTS = new Set(['i', 'o', 'in', 'out', 'services', 'bookings'])

// ─── Profile ────────────────────────────────────────────────────────────────

export type StorefrontProfile = {
  name: string
  sector: string
  tagline: string
  description: string
  phone: string
  whatsapp: string
  email: string
  street: string
  city: string
  state: string
  country: string
  zipCode: string
  currency: string
  /** Hex brand colour (older stores saved a preset key; resolved to hex on read). */
  theme: string
  logo: string
  /** The first banner, the booking page's cover. */
  cover: string
  banners: string[]
  workingDays: WeekDay[]
  deliveryDays: WeekDay[]
  storeSlug: string
  customDomain: string
  customDomainApproved: boolean
  enableBnpl: boolean
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export const resolveThemeHex = (value?: string | null) => {
  const trimmed = value?.trim()
  if (trimmed && HEX.test(trimmed)) return trimmed.toUpperCase()
  return STORE_THEMES.find(theme => theme.key === trimmed)?.primary ?? DEFAULT_THEME.primary
}

/** The preset matching a hex, or null for a custom colour. */
export const themeForHex = (hex: string, themes: StoreTheme[] = STORE_THEMES) =>
  themes.find(theme => theme.primary.toLowerCase() === hex.toLowerCase()) ?? null

export const normalizeDomain = (domain: string) => domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()

/** Sink's getServicesUrl: the public page clients book from. Null when the business has neither a slug nor an approved domain. */
export const getBookingUrl = (profile: Pick<StorefrontProfile, 'storeSlug' | 'customDomain' | 'customDomainApproved'>) => {
  if (profile.customDomainApproved && profile.customDomain.trim()) return `https://${normalizeDomain(profile.customDomain)}/services`
  const slug = profile.storeSlug.trim()
  if (!slug) return null
  const encoded = encodeURIComponent(slug)
  return RESERVED_STOREFRONT_SEGMENTS.has(slug.toLowerCase()) ? `${PLATFORM_STORE_ORIGIN}/o/${encoded}/services` : `${PLATFORM_STORE_ORIGIN}/${encoded}/services`
}

const weekDays = (value: unknown): WeekDay[] =>
  Array.isArray(value) ? value.map(str).filter((day): day is WeekDay => WEEK_DAYS.some(item => item.value === day)) : []

const mapProfile = (value: unknown): StorefrontProfile => {
  const record = asRecord(value)
  const owner = asRecord(record.owner)
  const banners = listFrom(record.banners, []).map(str).filter(Boolean)
  const legacy = str(record.banner)
  if (legacy && !banners.includes(legacy)) banners.unshift(legacy)
  return {
    name: str(record.name),
    sector: str(record.type),
    tagline: str(record.tag_line),
    description: str(record.description),
    phone: str(record.phone) || str(owner.phone),
    whatsapp: str(record.whatsapp_number),
    email: str(record.email) || str(owner.email),
    street: str(record.street),
    city: str(record.city),
    state: str(record.state),
    country: str(record.country) || 'Nigeria',
    zipCode: str(record.zip_code),
    currency: str(record.currency) || 'NGN',
    theme: resolveThemeHex(str(record.store_theme)),
    logo: str(record.logo),
    cover: banners[0] ?? '',
    banners,
    workingDays: weekDays(record.working_days),
    deliveryDays: weekDays(record.delivery_days),
    storeSlug: str(record.store_url),
    customDomain: str(record.custom_domain),
    customDomainApproved: record.custom_domain_approved === true,
    enableBnpl: record.enable_bnpl === true,
  }
}

let sampleProfile: StorefrontProfile = {
  name: 'Juno Studio',
  sector: 'Beauty & Personal Care',
  tagline: 'Healthy hair, beautiful finishes.',
  description: 'A calm, considered hair studio in the heart of Lagos. We specialise in healthy hair, beautiful finishes and appointments that start on time.',
  phone: '0802 400 1294',
  whatsapp: '',
  email: 'hello@junostudio.ng',
  street: '14 Admiralty Way',
  city: 'Lekki Phase 1',
  state: 'Lagos',
  country: 'Nigeria',
  zipCode: '',
  currency: 'NGN',
  theme: DEFAULT_THEME.primary,
  logo: '',
  cover: '',
  banners: [],
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  deliveryDays: [],
  storeSlug: 'juno-studio',
  customDomain: 'book.junostudio.ng',
  customDomainApproved: false,
  enableBnpl: false,
}

export const useStorefrontProfile = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.storefront, scope],
    queryFn: async () => (isLive() ? mapProfile((await fetchCurrentBusiness()).raw) : mockDelay({ ...sampleProfile })),
    enabled,
  })
}

// ─── Themes ─────────────────────────────────────────────────────────────────

const getThemes = async (): Promise<StoreTheme[]> => {
  if (!isLive()) return STORE_THEMES
  const response = asRecord(await apiRequest<unknown>('business/store_themes/'))
  const root = asRecord(response.data ?? response)
  const list: unknown = root.themes ?? root.results ?? root
  const entries = Array.isArray(list) ? list.map(item => [str(asRecord(item).key), item] as const) : Object.entries(asRecord(list))
  const themes = entries
    .map(([key, item]) => {
      const theme = asRecord(item)
      return { key: str(theme.key) || key, label: str(theme.label) || key, primary: str(theme.primary), onPrimary: str(theme.on_primary) || '#FFFFFF', surface: str(theme.surface), accent: str(theme.accent) }
    })
    .filter(theme => HEX.test(theme.primary))
  return themes.length ? themes : STORE_THEMES
}

export const useStoreThemes = () => useQuery({ queryKey: [...queryKeys.storeThemes, isLive()], queryFn: getThemes, staleTime: 60 * 60 * 1000, placeholderData: STORE_THEMES })

// ─── Writes ─────────────────────────────────────────────────────────────────

export type StorefrontPatch = Partial<Pick<StorefrontProfile, 'name' | 'sector' | 'tagline' | 'description' | 'phone' | 'whatsapp' | 'email' | 'street' | 'city' | 'state' | 'country' | 'zipCode' | 'currency' | 'theme' | 'customDomain' | 'workingDays' | 'deliveryDays'>> & {
  logoFile?: File
  /** When set, the saved banner URLs to keep (in order) and new files to append. */
  banners?: { keep: string[]; add: File[] }
}

const FIELDS: Partial<Record<keyof StorefrontPatch, string>> = {
  name: 'name', sector: 'type', tagline: 'tag_line', description: 'description', phone: 'phone', whatsapp: 'whatsapp_number',
  email: 'email', street: 'street', city: 'city', state: 'state', country: 'country', zipCode: 'zip_code', currency: 'currency',
  theme: 'store_theme', customDomain: 'custom_domain',
}

const toForm = (patch: StorefrontPatch) => {
  const form = new FormData()
  for (const [key, field] of Object.entries(FIELDS) as [keyof StorefrontPatch, string][]) {
    const value = patch[key]
    // Nullable fields are only sent when set, so a blank input never wipes a saved value.
    if (typeof value === 'string' && value.trim()) form.append(field, value.trim())
  }
  patch.workingDays?.forEach(day => form.append('working_days', day))
  patch.deliveryDays?.forEach(day => form.append('delivery_days', day))
  if (patch.logoFile) form.append('logo', patch.logoFile)
  if (patch.banners) {
    form.append('existing_banners', JSON.stringify(patch.banners.keep))
    patch.banners.add.forEach(file => form.append('banners', file))
  }
  return form
}

const applyToSample = (patch: StorefrontPatch) => {
  const { logoFile, banners, ...fields } = patch
  const nextBanners = banners ? [...banners.keep, ...banners.add.map(file => URL.createObjectURL(file))] : sampleProfile.banners
  sampleProfile = {
    ...sampleProfile,
    ...fields,
    ...(logoFile ? { logo: URL.createObjectURL(logoFile) } : {}),
    banners: nextBanners,
    cover: nextBanners[0] ?? '',
  }
  return mockDelay(null, 500)
}

const saveStorefront = (patch: StorefrontPatch) =>
  isLive() ? apiFormRequest<unknown>(`business/${requireBusinessId()}/`, 'PATCH', toForm(patch)) : applyToSample(patch)

const setBnpl = async (enableBnpl: boolean) => {
  if (!isLive()) {
    sampleProfile = { ...sampleProfile, enableBnpl }
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`business/${requireBusinessId()}/`, { method: 'PATCH', body: { enable_bnpl: enableBnpl } })
}

const useInvalidateStorefront = () => {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.business })
    await queryClient.invalidateQueries({ queryKey: queryKeys.storefront })
    await queryClient.invalidateQueries({ queryKey: queryKeys.businesses })
  }
}

/** Saves any subset of the profile: text fields, theme, logo, banners, days, domain. */
export const useSaveStorefront = () => useMutation({ mutationFn: saveStorefront, onSuccess: useInvalidateStorefront() })

export const useSetBnpl = () => useMutation({ mutationFn: setBnpl, onSuccess: useInvalidateStorefront() })

/** The backend rejects BNPL with a message keyed on `enable_bnpl`. */
export const bnplErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    const field = asRecord(error.data).enable_bnpl
    const message = Array.isArray(field) ? str(field[0]) : str(field)
    if (message) return message
  }
  return error instanceof Error ? error.message : 'Could not update buy now, pay later.'
}
