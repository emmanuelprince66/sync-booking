import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useAttendants } from '@/api/attendants'
import { errorMessage } from '@/api/auth'
import { useServiceCategories, type ServiceCategory } from '@/api/categories'
import { SERVICE_DURATIONS, SERVICE_IMAGE_MAX_MB, SERVICE_IMAGE_TYPES, SERVICE_MAX_IMAGES, useCreateService, useUpdateService, type Service } from '@/api/services'
import { durationLong } from '@/lib/dates'
import { serviceSchema, type ServiceValues } from '../schemas'

/** A gallery tile: a saved media image (mediaId) or a new file waiting to upload. */
export type GalleryImage = { key: string; url: string; mediaId?: string; file?: File }

const initialGallery = (service: Service | null): GalleryImage[] => (service?.media ?? []).map(item => ({ key: item.id, url: item.url, mediaId: item.id }))

export function useServiceForm(service: Service | null, onClose: () => void) {
  const create = useCreateService()
  const update = useUpdateService()
  const categories = useServiceCategories()
  const attendants = useAttendants()
  const [images, setImages] = useState<GalleryImage[]>(() => initialGallery(service))
  /** kept_media_ids is only sent once the gallery has been changed. */
  const [galleryTouched, setGalleryTouched] = useState(false)
  /** Older services carry a single `image` and no gallery: shown until the gallery gets images of its own. */
  // Removing it sends kept_media_ids="", which the backend also uses to clear the old `image`.
  const [legacyRemoved, setLegacyRemoved] = useState(false)
  const legacyImage = service && !legacyRemoved && service.media.length === 0 && service.image && images.length === 0 ? service.image : ''
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
    legacyImage,
    maxImages: SERVICE_MAX_IMAGES,
    canAddImage: images.length < SERVICE_MAX_IMAGES,
    imageAccept: SERVICE_IMAGE_TYPES.join(','),
    imageHint: `Up to ${SERVICE_MAX_IMAGES} JPG, PNG or GIF images, ${SERVICE_IMAGE_MAX_MB} MB each. The first one is the cover.`,
    addImages: (files: File[]) => {
      const valid = files.filter(file => {
        if (!(SERVICE_IMAGE_TYPES as readonly string[]).includes(file.type)) { toast.error(`${file.name}: use a JPG, PNG or GIF image.`); return false }
        if (file.size > SERVICE_IMAGE_MAX_MB * 1024 * 1024) { toast.error(`${file.name}: images must be ${SERVICE_IMAGE_MAX_MB} MB or smaller.`); return false }
        return true
      })
      const room = SERVICE_MAX_IMAGES - images.length
      if (valid.length > room) toast.error(`A service can have up to ${SERVICE_MAX_IMAGES} images.`)
      const added = valid.slice(0, Math.max(0, room)).map((file, index) => ({ key: `new-${Date.now()}-${index}`, url: URL.createObjectURL(file), file }))
      if (!added.length) return
      setImages(current => [...current, ...added])
      setGalleryTouched(true)
    },
    removeLegacyImage: () => {
      setLegacyRemoved(true)
      setGalleryTouched(true)
    },
    removeImage: (key: string) => {
      setImages(current => current.filter(image => image.key !== key))
      setGalleryTouched(true)
    },
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
        newImages: images.flatMap(image => (image.file ? [image.file] : [])),
        keptMediaIds: service && galleryTouched ? images.flatMap(image => (image.mediaId ? [image.mediaId] : [])) : null,
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
