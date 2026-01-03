import React from 'react'
import { PLAN_RULES, type PlanId } from '@/lib/plan-rules'
import UpgradeCta from '@/components/UpgradeCta'

type FeatureKey = keyof (typeof PLAN_RULES)['premium']['features']

type Props = {
  plan: PlanId
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function FeatureGate({ plan, feature, children, fallback }: Props) {
  const allowed = PLAN_RULES[plan]?.features?.[feature]

  if (allowed) return <>{children}</>

  return <>{fallback ?? <UpgradeCta />}</>
}
