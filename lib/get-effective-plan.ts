import type { PlanId, SubscriptionStatus } from './plan-rules'

export function getEffectivePlan(profile: {
  plan?: string | null
  subscription_status?: string | null
  trial_ends_at?: string | null
}): PlanId {
  const plan = (profile.plan || 'basic') as PlanId
  const status = (profile.subscription_status || 'active') as SubscriptionStatus

  // Regra de ouro: trial => premium efetivo
  if (status === 'trial') return 'premium'

  // segurança: só aceita os 3 planos
  if (plan === 'basic' || plan === 'professional' || plan === 'premium') return plan

  return 'basic'
}
