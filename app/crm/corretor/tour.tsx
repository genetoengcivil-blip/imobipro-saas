'use client'

import { useEffect, useState } from 'react'

type Step = {
  selector: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    selector: '[data-tour="dashboard"]',
    title: 'Dashboard',
    description: 'Aqui você acompanha seus números e desempenho.',
  },
  {
    selector: '[data-tour="imoveis"]',
    title: 'Imóveis',
    description: 'Cadastre e gerencie seus imóveis.',
  },
  {
    selector: '[data-tour="leads"]',
    title: 'Leads',
    description: 'Acompanhe contatos e negociações.',
  },
  {
    selector: '[data-tour="site"]',
    title: 'Seu site',
    description: 'Veja e personalize o site do corretor.',
  },
  {
    selector: '[data-tour="config"]',
    title: 'Configurações',
    description: 'Ajuste cores, logo e dados do perfil.',
  },
]

export default function TourOverlay({
  onFinish,
}: {
  onFinish: () => void
}) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const el = document.querySelector(
      steps[step].selector
    ) as HTMLElement | null

    if (el) {
      setRect(el.getBoundingClientRect())
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step])

  if (!rect) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Spotlight */}
      <div
        className="absolute border-2 border-blue-500 rounded-lg bg-transparent"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl p-4 shadow-xl w-72 pointer-events-auto"
        style={{
          top: rect.bottom + 12,
          left: rect.left,
        }}
      >
        <h3 className="font-bold mb-1">{steps[step].title}</h3>
        <p className="text-sm text-slate-600 mb-3">
          {steps[step].description}
        </p>

        <div className="flex justify-end gap-2">
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={onFinish}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
