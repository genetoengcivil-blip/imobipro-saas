# ImobiPro SaaS (Pronto)

## 1) Supabase (obrigatório)
- Execute `supabase_schema.sql` no Supabase > SQL Editor
- Supabase > Authentication > URL Configuration:
  - Site URL: http://localhost:3000
  - Redirect URLs: http://localhost:3000/*

## 2) Rodar local (PowerShell)
Dentro da pasta extraída:
  npx serve . --single

Rotas:
  /           (Landing)
  /login      (Login)
  /corretor   (CRM Corretor)
  /admin      (CRM Admin)
  /{slug}     (Site público do corretor)

## 3) Vercel
- Suba para GitHub
- Vercel: Import Project > Framework "Other" > Deploy
- Depois atualize no Supabase:
  - Site URL: https://SEU-PROJETO.vercel.app
  - Redirect URLs: https://SEU-PROJETO.vercel.app/*


## Mercado Pago (assinatura recorrente)

Este projeto implementa assinatura recorrente via endpoint **/preapproval** (sem plano associado) e Webhook.

### Variáveis (Vercel -> Environment Variables)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MP_ACCESS_TOKEN
- MP_WEBHOOK_SECRET (opcional, mas recomendado)
- APP_URL (ex.: https://seu-dominio.vercel.app)

### Rotas
- POST /api/mp/create-subscription  (gera link de checkout e grava subscription)
- POST /api/mp/webhook             (atualiza status no banco)
- GET  /api/cron/expire-trials     (cron diário, expira trials)

