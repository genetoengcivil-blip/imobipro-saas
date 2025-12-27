# IMOBIPRO — Deploy e Teste Real (Vercel + Supabase)

Este projeto é um frontend estático (HTML/JS) com funções serverless em `/api` para:
- Webhook do Mercado Pago
- Rotina (cron) de trial/pagamentos/bloqueio
- Criação de assinatura

## 1) Supabase (produção)
1. Crie um projeto no Supabase.
2. Execute **imobipro/supabase_schema.sql**
3. Execute **imobipro/supabase/migrations/01_imobipro_phase2.sql**

> Importante: ajuste/valide as políticas RLS conforme sua necessidade.

## 2) Variáveis de ambiente (Vercel)
Configure em **Project Settings → Environment Variables**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para webhook/cron)
- `MP_ACCESS_TOKEN` (Mercado Pago)
- `RESEND_API_KEY` (Resend)
- `WHATSAPP_TOKEN` (Meta WhatsApp Cloud API)
- `WHATSAPP_PHONE_NUMBER_ID`
- `APP_URL` (ex.: https://seuapp.vercel.app)

## 3) Rotas importantes
- Landing marketing: `imobipro/marketing/landing.html` (você pode copiar para `/index.html` se quiser virar sua página inicial)
- Webhook MP: `/api/mercadopago-webhook`
- Criar assinatura: `/api/create-subscription`
- Cron: `/api/cron-billing` (configurar Vercel Cron)

## 4) Checklist de teste real
1. Criar usuário e autenticar
2. Criar registro de subscription (trial 7 dias) no Supabase
3. Verificar downgrade ao encerrar trial (via cron)
4. Fazer upgrade (via create-subscription)
5. Simular falha e verificar avisos 15/24/48h e bloqueio (via cron)
6. Conferir CRM Admin (logs/auditoria)

## Observação
Os endpoints `/api` estão como **stubs** para você conectar:
- Mercado Pago (assinaturas + webhook)
- Resend (e-mails)
- WhatsApp Cloud API

Se você quiser, eu posso completar esses endpoints com suas credenciais e IDs (sem expor chaves no código).
