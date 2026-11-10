import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useAttendants } from '@/api/attendants'
import { errorMessage } from '@/api/auth'
import { isLive } from '@/api/http'
import { useServiceCategories, type ServiceCategory } from '@/api/categories'
import { SERVICE_DURATIONS, useCreateService, useUpdateService, type Service } from '@/api/services'
import { durationLong } from '@/lib/dates'
import { serviceSchema, type ServiceValues } from '../schemas'

/** The backend stores one image per service; the design's five-image gallery only works on sample data. */
const MAX_IMAGES = isLive() ? 1 : 5
const MAX_IMAGE_MB = 5

export function useServiceForm(service: Service | null, onClose: () => void) {
  const create = useCreateService()
  const update = useUpdateService()
  const categories = useServiceCategories()
  const attendants = useAttendants()
  const [images, setImages] = useState<{ url: string; file?: File }[]>(service?.image ? [{ url: service.image }] : [])
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name ?? '',
      categoryId: service?.categoryId ?? '',
      duration: service ? String(service.duration) : '60',
      amount: service ? String(service.amount) : '',
      description: service?.description ?? '',
      minDepositPercentage: service?.minDepositPercentage === null || !service ? '' : String(service.minDepositPercentage),
      maxCapacity: service ? String(service.maxCapacity) : '1',
      staffIds: service?.assignedStaffIds ?? [],
    },
  })
  const staffIds = useWatch({ control: form.control, name: 'staffIds' })

  // Some API rows name their category without its id (sink matches these by name too).
  const { setValue, getValues } = form
  useEffect(() => {
    if (!service?.categoryName || getValues('categoryId')) return
    const match = categories.data?.find(category => category.name.toLowerCase() === service.categoryName.toLowerCase())
    if (match) setValue('categoryId', match.id)
  }, [categories.data, service, getValues, setValue])

  return {
    register: form.register,
    errors: form.formState.errors,
    isEditing: Boolean(service),
    isSubmitting: create.isPending || update.isPending,
    durationOptions: SERVICE_DURATIONS.map(minutes => ({ value: String(minutes), label: durationLong(minutes) })),
    categoryOptions: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
    categoriesLoading: categories.isLoading,
    categoryDialogOpen,
    openCategoryDialog: () => setCategoryDialogOpen(true),
    closeCategoryDialog: () => setCategoryDialogOpen(false),
    /** Everything typed so far stays put; only the category changes. */
    onCategorySaved: (category: ServiceCategory) => form.setValue('categoryId', category.id, { shouldValidate: true }),
    staffOptions: (attendants.data ?? []).map(attendant => ({ value: attendant.id, label: attendant.name, hint: attendant.roleLabel })),
    staffIds,
    setStaffIds: (ids: string[]) => form.setValue('staffIds', ids),
    images,
    maxImages: MAX_IMAGES,
    canAddImage: images.length < MAX_IMAGES,
    addImage: (file: File) => {
      if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`Image must be ${MAX_IMAGE_MB} MB or smaller.`); return }
      setImages(current => [...current, { url: URL.createObjectURL(file), file }].slice(0, MAX_IMAGES))
    },
    removeImage: (index: number) => setImages(current => current.filter((_, position) => position !== index)),
    onSubmit: form.handleSubmit(async values => {
      const input = {
        name: values.name,
        categoryId: values.categoryId,
        description: values.description,
        amount: Number(values.amount),
        duration: Number(values.duration),
        minDepositPercentage: values.minDepositPercentage ? Number(values.minDepositPercentage) : null,
        maxCapacity: Number(values.maxCapacity),
        assignedStaffIds: values.staffIds,
        imageFile: images.find(image => image.file)?.file,
      }
      try {
        if (service) await update.mutateAsync({ id: service.id, input })
        else await create.mutateAsync(input)
        toast.success(service ? 'Service updated' : 'Service added to your storefront')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save this service.'))
      }
    }),
  }
}
