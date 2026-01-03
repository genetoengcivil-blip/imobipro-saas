'use client'

import { useEffect, useState, createContext } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Contexto global do corretor
export const CorretorContext = createContext<{
  plan: 'basic' | 'professional' | 'premium'
  subscriptionStatus: 'active' | 'inactive'
} | null>(null)

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<{
    plan: 'basic' | 'professional' | 'premium'
    subscriptionStatus: 'active' | 'inactive'
  } | null>(null)

  useEffect(() => {
    const guard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan, subscription_status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'corretor') {
        router.replace('/login')
        return
      }

      if (profile.subscription_status !== 'active') {
        router.replace('/assinatura')
        return
      }

      // ✅ NÃO bloqueia mais por rota
      setContext({
        plan: profile.plan,
        subscriptionStatus: profile.subscription_status,
      })

      setLoading(false)
    }

    guard()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Carregando CRM...
      </div>
    )
  }

  return (
    <CorretorContext.Provider value={context}>
      {children}
    </CorretorContext.Provider>
  )
}
