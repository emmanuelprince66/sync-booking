import { env } from '@/config/env'

/**
 * Address search for customer and KYC forms: a port of sink-inventory's utils/address.ts.
 * Sink proxies Geoapify through its server; this app has no server, so it calls it directly with a
 * browser key (VITE_GEOAPIFY_KEY, restrict it to your domains). With no key, search is off and the form
 * falls back to typing the address and picking the state and city, as sink does with GEOAPIFY_KEY unset.
 *
 * Coordinates: a picked suggestion's first, then the city's centroid, then the state's, else none.
 */

export type AddressSuggestion = {
  id: string
  /** Full line, what a dropdown row shows. */
  label: string
  /** Street line only, what goes in the address field. */
  address: string
  city: string
  state: string
  /** ISO subdivision code, e.g. "LA". May be "". */
  stateCode: string
  latitude: string
  longitude: string
}

export type Coordinates = { latitude: string; longitude: string }

const GEOAPIFY_AUTOCOMPLETE = 'https://api.geoapify.com/v1/geocode/autocomplete'
const COUNTRY_FILTER = 'countrycode:ng'

export const isAddressLookupEnabled = () => Boolean(env.geoapifyKey)

type GeoProperties = {
  lat?: number; lon?: number; housenumber?: string; street?: string; address_line1?: string; name?: string
  city?: string; town?: string; village?: string; suburb?: string; state?: string; state_code?: string
  formatted?: string; place_id?: string
}
type GeoFeature = { id?: string; properties?: GeoProperties; geometry?: { coordinates?: [number, number] } }

const toFixed6 = (value: unknown) => {
  const parsed = value === '' || value === null || value === undefined ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed.toFixed(6) : ''
}

const suggestionFromFeature = (feature: GeoFeature, index: number): AddressSuggestion | null => {
  const p = feature.properties ?? {}
  const latitude = toFixed6(p.lat ?? feature.geometry?.coordinates?.[1])
  const longitude = toFixed6(p.lon ?? feature.geometry?.coordinates?.[0])
  if (!latitude || !longitude) return null
  const street = [p.housenumber, p.street].filter(Boolean).join(' ') || p.address_line1 || p.name || ''
  return {
    id: String(p.place_id || feature.id || index),
    label: p.formatted || street,
    address: street,
    city: p.city || p.town || p.village || p.suburb || '',
    state: (p.state || '').replace(/\s+state$/i, '').trim(),
    stateCode: (p.state_code || '').replace(/^NG-/i, '').toUpperCase(),
    latitude,
    longitude,
  }
}

export const fetchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const url = new URL(GEOAPIFY_AUTOCOMPLETE)
  url.searchParams.set('text', query)
  url.searchParams.set('apiKey', env.geoapifyKey)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('limit', '6')
  url.searchParams.set('filter', COUNTRY_FILTER)
  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Address lookup failed')
  const data = await response.json() as { features?: GeoFeature[] }
  return (data.features ?? []).map(suggestionFromFeature).filter((item): item is AddressSuggestion => item !== null)
}

// ─── Nigerian states and cities ─────────────────────────────────────────────

export type NigeriaCity = { name: string; latitude: string; longitude: string }
export type NigeriaState = { name: string; isoCode: string; latitude: string; longitude: string; cities: NigeriaCity[] }

/** country-state-city carries every city on earth, so it loads only when a form needs it. */
export const loadNigeriaStates = async (): Promise<NigeriaState[]> => {
  const { State, City } = await import('country-state-city')
  return State.getStatesOfCountry('NG').map(state => ({
    name: state.name,
    isoCode: state.isoCode,
    latitude: state.latitude ?? '',
    longitude: state.longitude ?? '',
    cities: City.getCitiesOfState('NG', state.isoCode).map(city => ({ name: city.name, latitude: city.latitude ?? '', longitude: city.longitude ?? '' })),
  }))
}

const asCoordinates = (latitude: unknown, longitude: unknown): Coordinates | null => {
  const lat = toFixed6(latitude)
  const lng = toFixed6(longitude)
  // Both or neither: the backend treats them as an optional pair.
  return lat && lng ? { latitude: lat, longitude: lng } : null
}

/** A city's centroid, falling back to its state's. */
export const cityCentroid = (state?: NigeriaState, cityName?: string): Coordinates | null => {
  if (!state) return null
  const city = cityName ? state.cities.find(item => item.name.toLowerCase() === cityName.trim().toLowerCase()) : undefined
  return asCoordinates(city?.latitude, city?.longitude) ?? asCoordinates(state.latitude, state.longitude)
}

export const resolveCoordinates = (picked: Partial<Coordinates> | null | undefined, fallback: Coordinates | null) =>
  asCoordinates(picked?.latitude, picked?.longitude) ?? fallback

export const coordinatesPayload = (coords: Coordinates | null) => (coords ? { latitude: coords.latitude, longitude: coords.longitude } : {})
