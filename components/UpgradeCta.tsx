'use client'

import React from 'react'

type Props = {
  title?: string
  subtitle?: string
  buttonText?: string
}

export default function UpgradeCta({
  title = 'Recurso disponível apenas no seu próximo plano',
  subtitle = 'Faça upgrade para desbloquear esta funcionalidade.',
  buttonText = 'Fazer upgrade',
}: Props) {
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>{subtitle}</div>

      <button
        onClick={() => (window.location.href = '/upgrade')}
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {buttonText}
      </button>
    </div>
  )
}
