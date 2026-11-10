import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#173A2E] text-white shadow-[0_8px_20px_rgba(23,58,46,0.14)] hover:-translate-y-0.5 hover:bg-[#235441]',
  secondary: 'border border-[#173A2E] bg-white text-[#173A2E] hover:-translate-y-0.5',
  ghost: 'text-[#60796E] hover:bg-[#EDF3EF] hover:text-[#173A2E]',
  outline: 'border border-border bg-white text-[#3E584E] hover:border-[#9DB1A9] hover:text-[#173A2E]',
  danger: 'bg-[#C2483D] text-white hover:bg-[#A93C32]',
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children?: ReactNode
  variant?: ButtonVariant
  icon?: IconName
  /** Shows a spinner in place of the icon and disables the button. */
  loading?: boolean
}

/** The design's PrimaryButton and its outline/secondary siblings. */
export function Button({ children, variant = 'primary', icon, loading = false, disabled, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0', variants[variant], className)} {...props}>
    {loading
      ? <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/>
      : icon && <Icon name={icon} size={18}/>} {children}
  </button>
}
