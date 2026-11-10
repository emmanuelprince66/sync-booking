import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateCategory, useUpdateCategory, type ServiceCategory } from '@/api/categories'
import { categorySchema, type CategoryValues } from '../schemas'

type CategoryFormOptions = { category: ServiceCategory | null; onClose: () => void; onSaved?: (category: ServiceCategory) => void }

/** Add or rename a category. Mounted with the dialog, so it opens with the saved name or blank. */
export function useCategoryForm({ category, onClose, onSaved }: CategoryFormOptions) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const form = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: category?.name ?? '' } })
  return {
    register: form.register,
    errors: form.formState.errors,
    isEditing: Boolean(category),
    isSubmitting: create.isPending || update.isPending,
    onSubmit: form.handleSubmit(async ({ name }) => {
      try {
        const saved = category ? { id: category.id, name } : await create.mutateAsync(name)
        if (category) await update.mutateAsync(saved)
        toast.success(category ? 'Category updated' : 'Category added')
        onSaved?.(saved)
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save this category.'))
      }
    }),
  }
}
