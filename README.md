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
