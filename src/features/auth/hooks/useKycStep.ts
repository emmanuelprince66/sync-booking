import { useNavigate } from 'react-router'
import { paths } from '@/routes/paths'
import { KYC_BENEFITS } from '../constants'

export function useKycStep() {
  const navigate = useNavigate()
  return {
    benefits: KYC_BENEFITS,
    startKyc: () => navigate(paths.kyc),
    goBack: () => navigate(paths.signupBusiness),
    finish: () => navigate(paths.dashboard, { replace: true }),
  }
}
