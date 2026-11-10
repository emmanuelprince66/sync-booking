import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteCategory, useServiceCategories, type ServiceCategory } from '@/api/categories'
import { useAllServices } from '@/api/services'
import { serviceColor } from '@/features/bookings/utils'
import { initials } from '@/lib/format'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

export type CategoryDialog = { mode: 'add' } | { mode: 'edit'; category: ServiceCategory } | { mode: 'delete'; category: ServiceCategory } | null

/** Categories: list, search, add, rename and delete. The endpoint returns them all, so search and pages are cut here, as in sink. */
export function useCategoriesPage() {
  const navigate = useNavigate()
  const query = useServiceCategories()
  const servicesQuery = useAllServices()
  const remove = useDeleteCategory()
  const [search, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<CategoryDialog>(null)

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const service of servicesQuery.data?.services ?? []) counts.set(service.categoryId, (counts.get(service.categoryId) ?? 0) + 1)
    return counts
  }, [servicesQuery.data])

  const all = useMemo(() => query.data ?? [], [query.data])
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? all.filter(category => category.name.toLowerCase().includes(term)) : all
  }, [all, search])
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const serviceCountLabel = (category: ServiceCategory) => {
    const count = countByCategory.get(category.id) ?? 0
    return `${count} ${count === 1 ? 'service' : 'services'}`
  }

  return {
    goBack: () => navigate(paths.services),
    search,
    setSearch: (value: string) => { setSearchValue(value); setPage(1) },
    rows: matches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE).map((category, index) => ({
      category,
      initials: initials(category.name || '?'),
      color: serviceColor(index),
      services: serviceCountLabel(category),
    })),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => void query.refetch(),
    isEmpty: !query.isLoading && matches.length === 0,
    isSearching: Boolean(search.trim()),
    page: safePage,
    totalPages,
    setPage,
    dialog,
    openAdd: () => setDialog({ mode: 'add' }),
    openEdit: (category: ServiceCategory) => setDialog({ mode: 'edit', category }),
    openDelete: (category: ServiceCategory) => setDialog({ mode: 'delete', category }),
    closeDialog: () => setDialog(null),
    deleteNote: (category: ServiceCategory) => ((countByCategory.get(category.id) ?? 0) > 0 ? ` ${serviceCountLabel(category)} use it, and will need a new category.` : ''),
    isDeleting: remove.isPending,
    confirmDelete: async (category: ServiceCategory) => {
      try {
        await remove.mutateAsync(category.id)
        toast.success(`${category.name} deleted`)
        setDialog(null)
      } catch (error) {
        toast.error(errorMessage(error, 'Could not delete this category.'))
      }
    },
  }
}
