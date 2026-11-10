import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { normalizeDomain, STORE_DNS_TARGET, useSaveStorefront, useStorefrontProfile } from '@/api/storefront'
import { domainSchema, type DomainValues } from '../schemas'

/** Custom domain (PATCH business { custom_domain }); a reviewer approves it on the backend. */
export function useCustomDomain() {
  const query = useStorefrontProfile()
  const save = useSaveStorefront()
  const values = useMemo<DomainValues>(() => ({ domain: query.data?.customDomain ?? '' }), [query.data])
  const form = useForm<DomainValues>({ resolver: zodResolver(domainSchema), values })
  const domain = useWatch({ control: form.control, name: 'domain' }) ?? ''
  const host = normalizeDomain(domain)
  const firstLabel = host.split('.')[0] || 'book'
  const saved = query.data?.customDomain ?? ''
  const approved = Boolean(query.data?.customDomainApproved && normalizeDomain(saved) === host)
  const pending = Boolean(saved && !query.data?.customDomainApproved && normalizeDomain(saved) === host)

  return {
    isLoading: query.isLoading,
    register: form.register,
    errors: form.formState.errors,
    status: approved ? 'approved' as const : pending ? 'pending' as const : 'none' as const,
    recordName: firstLabel,
    dnsTarget: STORE_DNS_TARGET,
    isSubmitting: save.isPending,
    isChecking: query.isFetching,
    /** No DNS-check endpoint: this re-reads the approval flag on the business. */
    check: async () => {
      const { data } = await query.refetch()
      if (data?.customDomainApproved) toast.success('Your domain is approved and live')
      else if (data?.customDomain) toast.success('Still waiting on verification. It can take up to 24 hours.')
      else toast.success('No domain saved yet')
    },
    onSubmit: form.handleSubmit(async input => {
      try {
        await save.mutateAsync({ customDomain: normalizeDomain(input.domain) })
        toast.success('Domain verification started')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save this domain.'))
      }
    }),
  }
}
