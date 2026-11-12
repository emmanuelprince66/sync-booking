import { Navigate, useParams } from 'react-router'
import { branchPath, servicesPath, setupPath } from './paths'

/** Old standalone pages that now live as tabs: /team, /branches, /storefront → Setup; /availability → Services. */
export const TeamRedirect = () => <Navigate to={setupPath('team')} replace/>
export const BranchesRedirect = () => <Navigate to={setupPath('branches')} replace/>
export const StorefrontRedirect = () => <Navigate to={setupPath('storefront')} replace/>
export const AvailabilityRedirect = () => <Navigate to={servicesPath('availability')} replace/>

/** /branches/:branchId → the branch's staff view inside Setup → Branches. */
export function BranchDetailRedirect() {
  const { branchId = '' } = useParams()
  return <Navigate to={branchId ? branchPath(branchId) : setupPath('branches')} replace/>
}
