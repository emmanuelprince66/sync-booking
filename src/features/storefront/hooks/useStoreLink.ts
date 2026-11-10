import { useId } from 'react'
import { toast } from 'sonner'
import { getBookingUrl, type StorefrontProfile } from '@/api/storefront'
import { useClipboard } from '@/hooks/useClipboard'
import { useDisclosure } from '@/hooks/useDisclosure'

const QR_EXPORT_SIZE = 1024

/** Renders the on-screen QR (an SVG) onto a white canvas and downloads it as a PNG. */
const downloadSvgAsPng = (svg: SVGSVGElement, fileName: string) => new Promise<void>((resolve, reject) => {
  const source = new XMLSerializer().serializeToString(svg)
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = QR_EXPORT_SIZE
    canvas.height = QR_EXPORT_SIZE
    const context = canvas.getContext('2d')
    if (!context) { reject(new Error('Canvas unavailable')); return }
    const margin = QR_EXPORT_SIZE * 0.06
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, QR_EXPORT_SIZE, QR_EXPORT_SIZE)
    context.drawImage(image, margin, margin, QR_EXPORT_SIZE - margin * 2, QR_EXPORT_SIZE - margin * 2)
    const link = document.createElement('a')
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
    resolve()
  }
  image.onerror = () => reject(new Error('Could not draw the QR code'))
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
})

/** Booking link card: copy, open, share, the QR for the counter, and the custom-domain dialog. */
export function useStoreLink(profile: StorefrontProfile) {
  const { copied, copy } = useClipboard()
  const domainDialog = useDisclosure()
  // An id rather than a ref: the QR is only read in the download handler.
  const qrId = useId()
  const url = getBookingUrl(profile)
  const slug = profile.storeSlug || 'booking-page'

  return {
    url: url ?? '',
    hasUrl: Boolean(url),
    displayUrl: url ? url.replace(/^https?:\/\//, '') : '',
    copied,
    copyUrl: () => { if (url) { void copy(url); toast.success('Booking link copied') } },
    shareOnWhatsApp: url ? `https://wa.me/?text=${encodeURIComponent(`Book with ${profile.name || 'us'}: ${url}`)}` : '',
    qrId,
    downloadQr: async () => {
      const svg = document.getElementById(qrId)?.querySelector('svg')
      if (!svg) return
      try {
        await downloadSvgAsPng(svg, `${slug}-booking-qr.png`)
      } catch {
        toast.error('Could not download the QR code.')
      }
    },
    domain: profile.customDomain,
    domainStatus: !profile.customDomain ? 'none' as const : profile.customDomainApproved ? 'connected' as const : 'pending' as const,
    domainDialog,
  }
}

export type StoreLinkModel = ReturnType<typeof useStoreLink>
