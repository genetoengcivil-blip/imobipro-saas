'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    async function loadLanding() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch('/landing_page.html', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Não foi possível carregar /landing_page.html (HTTP ${res.status}). Verifique se o arquivo está em /public.`);
        }

        const text = await res.text();
        if (mounted) setHtml(text);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Erro ao carregar a landing.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadLanding();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
        Carregando…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
        <h2 style={{ margin: '0 0 12px' }}>Landing não carregou</h2>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      id="landing-root"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ minHeight: '100vh' }}
    />
  );
}
