import type { ReactNode } from 'react'
import type { ServiceCategory } from '@/api/categories'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { FormModal } from '@/components/ui/Modal'
import { useCategoryForm } from '../hooks/useCategoryForm'

type CategoryFormModalProps = {
  category: ServiceCategory | null
  onClose: () => void
  onSaved?: (category: ServiceCategory) => void
  /** Extra line under the name, e.g. a link to the full list. */
  footnote?: ReactNode
}

/** Add or rename a category: on the Categories page, and in place over the service form. */
export function CategoryFormModal({ category, onClose, onSaved, footnote }: CategoryFormModalProps) {
  const form = useCategoryForm({ category, onClose, onSaved })
  return <FormModal open onClose={onClose} eyebrow="Service categories" title={form.isEditing ? 'Edit category' : 'Add a category'} maxWidthClassName="max-w-[440px]" onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>{form.isEditing ? 'Save changes' : 'Add category'}</Button>
  </>}>
    <div className="flex flex-col gap-3">
      <Field label="Category name" placeholder="Hair & beauty" autoComplete="off" error={form.errors.name?.message} {...form.register('name')}/>
      {footnote}
    </div>
  </FormModal>
}
