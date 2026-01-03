export type PlanId = 'basic' | 'professional' | 'premium'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'downgraded' | string

export const PLAN_RULES: Record<
  PlanId,
  {
    maxImoveis: number
    maxUsers: number
    features: {
      crmAvancado: boolean
      automacao: boolean
      relatorios: boolean
      appMobile: boolean
      funil: boolean
      multisite: boolean
      apiIntegracoes: boolean
      treinamento: boolean
      seoPersonalizado: boolean
    }
  }
> = {
  basic: {
    maxImoveis: 50,
    maxUsers: 1,
    features: {
      crmAvancado: false,
      automacao: false,
      relatorios: false,
      appMobile: false,
      funil: false,
      multisite: false,
      apiIntegracoes: false,
      treinamento: false,
      seoPersonalizado: false,
    },
  },

  professional: {
    maxImoveis: 200,
    maxUsers: 3,
    features: {
      crmAvancado: true,
      automacao: true,
      relatorios: true,
      appMobile: true,
      funil: false, // funil completo é premium (conforme sua descrição)
      multisite: false,
      apiIntegracoes: false,
      treinamento: false,
      seoPersonalizado: true,
    },
  },

  premium: {
    maxImoveis: Number.POSITIVE_INFINITY,
    maxUsers: Number.POSITIVE_INFINITY,
    features: {
      crmAvancado: true,
      automacao: true,
      relatorios: true,
      appMobile: true,
      funil: true,
      multisite: true,
      apiIntegracoes: true,
      treinamento: true,
      seoPersonalizado: true,
    },
  },
}
