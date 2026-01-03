'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TourOverlay from './tour'
import { applyPlanGuards } from './planGuard'

export default function CrmCorretorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [html, setHtml] = useState<string>('')
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      // Carrega HTML 1:1
      const res = await fetch('/crm_corretor.html')
      const rawHtml = await res.text()
      setHtml(rawHtml)

      // Busca perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, first_access_completed')
        .eq('id', session.user.id)
        .single()

      // Bloqueio por plano (visual)
      setTimeout(() => {
        applyPlanGuards(profile?.plan || 'basic')
      }, 300)

      // Tour só no primeiro acesso OU se solicitado
      const forceTour = localStorage.getItem('crm_force_tour') === '1'
      if (!profile?.first_access_completed || forceTour) {
        setShowTour(true)
      }
    }

    init()
  }, [router])

  // Botão Ajuda → repetir tour ou por tópico
  useEffect(() => {
    if (!html) return
    const btn = document.getElementById('btn-ajuda')
    if (!btn) return

    const onClick = (e: any) => {
      e.preventDefault()
      localStorage.setItem('crm_force_tour', '1')
      localStorage.removeItem('crm_tour_done')
      localStorage.removeItem('crm_tour_step')
      location.reload()
    }

    btn.addEventListener('click', onClick)
    return () => btn.removeEventListener('click', onClick)
  }, [html])

  async function finishTour() {
    setShowTour(false)
    localStorage.removeItem('crm_force_tour')
    localStorage.setItem('crm_tour_done', '1')

    const { data } = await supabase.auth.getSession()
    if (data?.session?.user) {
      await supabase
        .from('profiles')
        .update({ first_access_completed: true })
        .eq('id', data.session.user.id)
    }
  }

  return (
    <>
      {showTour && <TourOverlay onFinish={finishTour} />}

      <div
        id="crm-root"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  )
}
