import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-3 mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-primary-100">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">{children}</div>

        {/* Footer */}
        <p className="text-center text-primary-100 text-sm mt-6">
          © 2024 Mock Interview Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}
