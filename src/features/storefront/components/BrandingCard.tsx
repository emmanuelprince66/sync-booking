import { Check, ImagePlus, Palette, Star, Trash2 } from 'lucide-react'
import { FilePicker } from '@/components/ui/common'
import { fieldLabelClass } from '@/components/ui/Field'
import { InitialsTile } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import type { BrandingModel } from '../hooks/useBranding'
import { CardActions, SettingsCard } from './SettingsCard'

export function BrandingCard({ branding, name }: { branding: BrandingModel; name: string }) {
  return <SettingsCard icon={Palette} title="Branding" description="Your logo, cover banners and brand colour on your booking page.">
    <div className="flex flex-col gap-6">
      <div>
        <span className={fieldLabelClass}>Logo</span>
        <FilePicker accept="image/*" onFile={branding.pickLogo} className="flex items-center gap-4 rounded-2xl border border-dashed border-[#A9BCB2] bg-[#F5F8F4] p-4 transition hover:border-[#329661]">
          <InitialsTile initials={(name || 'B').charAt(0).toUpperCase()} image={branding.logo || undefined} color="bg-[#FFCA68]" className="h-14 w-14 rounded-xl text-lg"/>
          <span className="min-w-0"><span className="block text-sm font-extrabold text-[#29483B]">{branding.logo ? 'Change logo' : 'Upload your logo'}</span><span className="mt-0.5 block text-[11px] font-semibold text-[#8A9C93]">Square PNG or JPG · up to 5 MB</span></span>
        </FilePicker>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-extrabold text-[#29483B]">Cover banners</span><span className="text-[11px] font-bold text-[#8A9C93]">{branding.banners.length}/{branding.maxBanners}</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {branding.banners.map((banner, index) => <div key={banner.id} className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-[#F1F5F0]">
            <img src={banner.url} alt={`Banner ${index + 1}`} className="h-full w-full object-cover"/>
            <span className="absolute left-2 top-2 flex gap-1">
              {index === 0 && <span className="rounded-full bg-[#173A2E] px-2 py-0.5 text-[9px] font-extrabold text-white">Cover</span>}
              {banner.file && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold text-[#24764F] shadow-sm">New</span>}
            </span>
            <span className="absolute right-2 top-2 flex gap-1">
              {index > 0 && <button type="button" onClick={() => branding.makeCover(banner.id)} aria-label={`Make banner ${index + 1} the cover`} title="Make cover" className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-[#24764F] shadow-sm hover:bg-white"><Star size={13}/></button>}
              <button type="button" onClick={() => branding.removeBanner(banner.id)} aria-label={`Remove banner ${index + 1}`} className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-[#C2483D] shadow-sm hover:bg-white"><Trash2 size={13}/></button>
            </span>
          </div>)}
          {branding.canAddBanner && <FilePicker accept="image/*" onFile={branding.addBanner} className="flex aspect-[16/9] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#A9BCB2] bg-[#F5F8F4] text-[#60796E] transition hover:border-[#329661]">
            <ImagePlus size={18}/><span className="text-[11px] font-extrabold">Add banner</span>
          </FilePicker>}
        </div>
        <p className="mt-2 text-[11px] font-semibold text-[#8A9C93]">Wide images (1600 × 600) look best. The first is your cover; the rest rotate under it.</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-extrabold text-[#29483B]">Brand colour</span><span className="text-[11px] font-bold text-[#8A9C93]">{branding.activeTheme?.label ?? branding.theme}</span></div>
        <div role="radiogroup" aria-label="Brand colour" className="grid grid-cols-6 gap-2.5 sm:grid-cols-11">
          {branding.themes.map(theme => {
            const selected = theme.primary.toLowerCase() === branding.theme.toLowerCase()
            return <button key={theme.key} type="button" role="radio" aria-checked={selected} aria-label={theme.label} title={theme.label} onClick={() => branding.selectTheme(theme)} className={cn('grid aspect-square place-items-center rounded-full transition', selected ? 'ring-2 ring-[#173A2E] ring-offset-2' : 'hover:scale-105')} style={{ backgroundColor: theme.primary, color: theme.onPrimary }}>
              {selected && <Check size={14} strokeWidth={3}/>}
            </button>
          })}
        </div>
      </div>
    </div>
    <CardActions dirty={branding.dirty} saving={branding.saving} onReset={branding.reset} onSave={branding.submit} saveLabel="Save branding"/>
  </SettingsCard>
}
