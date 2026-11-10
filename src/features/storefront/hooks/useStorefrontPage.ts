import { getBookingUrl, useStorefrontProfile, useStoreThemes } from '@/api/storefront'

/** Storefront root: the business profile and theme list. The editor mounts once the profile is in. */
export function useStorefrontPage() {
  const profileQuery = useStorefrontProfile()
  const themesQuery = useStoreThemes()
  const profile = profileQuery.data
  return {
    profile,
    themes: themesQuery.data ?? [],
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    retry: () => void profileQuery.refetch(),
    bookingUrl: profile ? getBookingUrl(profile) ?? '' : '',
  }
}
