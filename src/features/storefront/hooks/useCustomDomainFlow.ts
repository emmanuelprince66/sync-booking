import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { normalizeDomain, STORE_DNS_TARGET, useSaveStorefront } from '@/api/storefront'
import { useClipboard } from '@/hooks/useClipboard'
import { domainSchema } from '../schemas'

/** SyncShip's two-step custom domain flow: enter the domain, then add the CNAME and save. */
export function useCustomDomainFlow(currentDomain: string, onDone: () => void) {
  const [step, setStep] = useState<1 | 2>(1)
  const [input, setInput] = useState(currentDomain)
  const [error, setError] = useState('')
  const { copied, copy } = useClipboard(1800)
  const save = useSaveStorefront()
  const domain = normalizeDomain(input)

  return {
    step,
    input,
    setInput: (value: string) => { setInput(value); setError('') },
    error,
    domain,
    dnsTarget: STORE_DNS_TARGET,
    /** "book" for book.example.com, "@" for an apex domain. */
    hostLabel: domain.split('.').length > 2 ? domain.split('.').slice(0, -2).join('.') : '@',
    copied,
    copyTarget: () => void copy(STORE_DNS_TARGET),
    continueToDns: () => {
      const result = domainSchema.safeParse(domain)
      if (!result.success) { setError(result.error.issues[0]?.message ?? 'Enter a valid domain'); return }
      setError('')
      setInput(domain)
      setStep(2)
    },
    back: () => setStep(1),
    submit: () => save.mutate({ customDomain: domain }, {
      onSuccess: () => { toast.success('Domain saved. We’ll connect it once your DNS record is live.'); onDone() },
      onError: failure => toast.error(errorMessage(failure, 'Could not save this domain.')),
    }),
    saving: save.isPending,
  }
}
