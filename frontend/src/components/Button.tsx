import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}: ButtonProps) {
  const baseStyles = 'font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed'
  const variantStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  )
}
