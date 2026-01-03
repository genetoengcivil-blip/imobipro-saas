'use client'

import { useContext, ReactNode } from 'react'
import { CorretorContext } from '../layout'

type Feature =
  | 'crm_basic'
  | 'crm_advanced'
  | 'reports'
  | 'site'
  | 'automation'
  | 'mobile_app'
  | 'unlimited'

const PLAN_FEATURES: Record<
  'basic' | 'professional' | 'premium',
  Feature[]
> = {
  basic: ['crm_basic', 'site'],
  professional: ['crm_basic', 'crm_advanced', 'site', 'reports', 'mobile_app'],
  premium: ['unlimited'],
}

export default function FeatureGate({
  feature,
  children,
}: {
  feature: Feature
  children: ReactNode
}) {
  const ctx = useContext(CorretorContext)

  if (!ctx) return null

  const { plan } = ctx

  const allowed =
    plan === 'premium' ||
    PLAN_FEATURES[plan]?.includes(feature)

  if (allowed) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Conteúdo escurecido */}
      <div className="opacity-40 pointer-events-none">
        {children}
      </div>

      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => alert('Faça upgrade para liberar este recurso')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
        >
          🔒 Recurso Premium
        </button>
      </div>
    </div>
  )
}
