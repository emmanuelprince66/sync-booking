import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { MAX_BANNERS, themeForHex, useSaveStorefront, type StorefrontProfile, type StoreTheme } from '@/api/storefront'

export type BannerItem = { id: string; url: string; file?: File }

const MAX_IMAGE_MB = 5

const validImage = (file: File) => {
  if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return false }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`Images must be ${MAX_IMAGE_MB} MB or smaller.`); return false }
  return true
}

const savedBanners = (profile: StorefrontProfile): BannerItem[] => profile.banners.map(url => ({ id: url, url }))

/**
 * Logo, banners (the first is the booking page cover) and brand colour. New files are previewed with
 * object URLs, revoked on unmount, and only sent on save; banners are only sent once touched, so a
 * colour change never clears saved banners.
 */
export function useBranding(profile: StorefrontProfile, themes: StoreTheme[]) {
  const [logo, setLogo] = useState<{ url: string; file?: File }>({ url: profile.logo })
  const [banners, setBanners] = useState<BannerItem[]>(() => savedBanners(profile))
  const [bannersDirty, setBannersDirty] = useState(false)
  const [theme, setTheme] = useState(profile.theme)
  const objectUrls = useRef<string[]>([])
  const save = useSaveStorefront()

  useEffect(() => () => objectUrls.current.forEach(url => URL.revokeObjectURL(url)), [])

  const preview = (file: File) => {
    const url = URL.createObjectURL(file)
    objectUrls.current.push(url)
    return url
  }

  const dirty = Boolean(logo.file) || bannersDirty || theme.toLowerCase() !== profile.theme.toLowerCase()

  return {
    logo: logo.url,
    pickLogo: (file: File) => { if (validImage(file)) setLogo({ url: preview(file), file }) },
    banners,
    canAddBanner: banners.length < MAX_BANNERS,
    maxBanners: MAX_BANNERS,
    addBanner: (file: File) => {
      if (banners.length >= MAX_BANNERS) { toast.error(`You can add up to ${MAX_BANNERS} banners.`); return }
      if (!validImage(file)) return
      setBanners(current => [...current, { id: `new-${crypto.randomUUID()}`, url: preview(file), file }])
      setBannersDirty(true)
    },
    removeBanner: (id: string) => { setBanners(current => current.filter(item => item.id !== id)); setBannersDirty(true) },
    /** Moves a banner to the front, making it the cover. */
    makeCover: (id: string) => {
      setBanners(current => [...current.filter(item => item.id === id), ...current.filter(item => item.id !== id)])
      setBannersDirty(true)
    },
    themes,
    theme,
    activeTheme: themeForHex(theme, themes) ?? themes[0],
    selectTheme: (value: StoreTheme) => setTheme(value.primary),
    dirty,
    reset: () => {
      setLogo({ url: profile.logo })
      setBanners(savedBanners(profile))
      setBannersDirty(false)
      setTheme(profile.theme)
    },
    submit: () => save.mutate({
      theme,
      logoFile: logo.file,
      banners: bannersDirty ? { keep: banners.filter(item => !item.file).map(item => item.url), add: banners.flatMap(item => (item.file ? [item.file] : [])) } : undefined,
    }, {
      onSuccess: () => { toast.success('Branding saved'); setBannersDirty(false); setLogo(current => ({ url: current.url })) },
      onError: error => toast.error(errorMessage(error, 'Could not save your branding.')),
    }),
    saving: save.isPending,
  }
}

export type BrandingModel = ReturnType<typeof useBranding>
