import { Upload, X } from 'lucide-react'
import type { Service } from '@/api/services'
import { Button } from '@/components/ui/Button'
import { FilePicker } from '@/components/ui/common'
import { Field, TextareaField } from '@/components/ui/Field'
import { FormModal } from '@/components/ui/Modal'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal'
import { paths } from '@/routes/paths'
import { useServiceForm } from '../hooks/useServiceForm'

/** The design's add service dialog, plus the category, deposit, capacity and staff fields sink's form has. */
export function ServiceFormModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const form = useServiceForm(service, onClose)
  return <><FormModal open onClose={onClose} eyebrow="Service catalogue" title={form.isEditing ? 'Edit service' : 'Add a service'} maxWidthClassName="max-w-[610px]" onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Save service</Button>
  </>}>
    <div className="flex flex-col gap-5">
      <Field label="Service name" placeholder="Natural hair styling" error={form.errors.name?.message} {...form.register('name')}/>
      <OptionSelect label="Category" placeholder={form.categoriesLoading ? 'Loading…' : 'Select a category'} options={form.categoryOptions} error={form.errors.categoryId?.message} action={{ label: 'Add / manage categories', onClick: form.openCategoryDialog }} {...form.register('categoryId')}/>
      <div className="grid grid-cols-2 gap-4">
        <OptionSelect label="Duration" options={form.durationOptions} error={form.errors.duration?.message} {...form.register('duration')}/>
        <Field label="Price" inputMode="decimal" placeholder="15000" error={form.errors.amount?.message} {...form.register('amount')}/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. deposit %" inputMode="numeric" placeholder="Default" error={form.errors.minDepositPercentage?.message} {...form.register('minDepositPercentage')}/>
        <Field label="Capacity" inputMode="numeric" error={form.errors.maxCapacity?.message} {...form.register('maxCapacity')}/>
      </div>
      {form.staffOptions.length > 0 && <MultiSelect label="Attendees" placeholder="Anyone on your team" hint="Leave empty to let anyone on your team take this service." options={form.staffOptions} value={form.staffIds} onChange={form.setStaffIds}/>}
      <div>
        <span className="text-sm font-extrabold text-[#29483B]">Service gallery</span>
        <p className="mt-0.5 text-xs font-semibold text-[#8A9C93]">{form.imageHint}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {form.legacyImage && <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#CDEEDC]">
            <img src={form.legacyImage} alt="Current service image" className="h-full w-full object-cover"/>
            <span className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-white/85 px-1.5 py-0.5 text-center text-[9px] font-black text-[#29483B]">Current</span>
            <button type="button" aria-label="Remove current image" onClick={form.removeLegacyImage} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/85 text-[#29483B]"><X size={12}/></button>
          </div>}
          {form.images.map((image, index) => <div key={image.key} className="relative aspect-square overflow-hidden rounded-2xl bg-[#CDEEDC]">
            <img src={image.url} alt={`Service image ${index + 1}`} className="h-full w-full object-cover"/>
            {index === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-lg bg-white/85 px-1.5 py-0.5 text-[9px] font-black text-[#29483B]">Cover</span>}
            <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => form.removeImage(image.key)} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/85 text-[#29483B]"><X size={12}/></button>
          </div>)}
          {form.canAddImage && <FilePicker accept={form.imageAccept} onFiles={form.addImages} className="grid aspect-square place-items-center rounded-2xl border border-dashed border-[#9EB2A8] bg-[#F7FAF6] text-[#577066]">
            <div className="text-center"><Upload size={20} className="mx-auto"/><p className="mt-1 text-[10px] font-black">Add images</p></div>
          </FilePicker>}
        </div>
        <p className="mt-2 font-mono text-[10px] text-[#93A39B]">{form.imageCount}/{form.maxImages} images</p>
      </div>
      <TextareaField label="Description" placeholder="Describe the service, preparation and what is included..." error={form.errors.description?.message} {...form.register('description')}/>
    </div>
  </FormModal>
    {/* Beside the form, not inside it: a dialog's submit would otherwise bubble into the service form through React's tree. */}
    {form.categoryDialogOpen && <CategoryFormModal category={null} onClose={form.closeCategoryDialog} onSaved={form.onCategorySaved} footnote={<a href={paths.serviceCategories} target="_blank" rel="noreferrer" className="self-start text-xs font-black text-[#24764F]">Edit or delete categories in a new tab</a>}/>}
  </>
}
