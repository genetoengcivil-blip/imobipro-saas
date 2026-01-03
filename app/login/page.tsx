'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      setErrorMessage('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      setErrorMessage('Perfil não encontrado.')
      setLoading(false)
      return
    }

    if (profile.role === 'admin') {
      router.push('/crm/admin')
    } else {
      router.push('/crm/corretor')
    }
  }

  return (
    <>
      {/* FONT AWESOME – igual ao HTML */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* CSS ORIGINAL – 1:1 */}
      <style jsx global>{`
        :root {
          --primary: #1a3a5f;
          --primary-dark: #0d2842;
          --primary-light: #2c5282;
          --secondary: #25D366;
          --secondary-dark: #128C7E;
          --light: #ffffff;
          --dark: #1e293b;
          --gray: #64748b;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        body {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 1200px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 700px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          background: var(--light);
        }

        .login-left {
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-right {
          background: linear-gradient(135deg, var(--primary-dark), var(--primary));
          padding: 60px;
          color: var(--light);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .logo {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 40px;
        }

        .logo span {
          color: var(--secondary);
        }

        h1 {
          font-size: 2.5rem;
          color: var(--primary);
          margin-bottom: 10px;
          font-weight: 800;
        }

        .subtitle {
          color: var(--gray);
          margin-bottom: 40px;
          font-size: 1.1rem;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--dark);
        }

        .form-group input {
          width: 100%;
          padding: 15px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          color: #0f172a;
          background-color: #ffffff;
        }

        .form-group input::placeholder {
          color: #94a3b8;
        }

        .login-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: var(--light);
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .login-btn:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .error-message {
          background: #fee;
          color: #b91c1c;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          display: none;
        }

        .error-message.show {
          display: block;
        }

        .features-list {
          list-style: none;
          margin-top: 30px;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          font-size: 1.05rem;
        }

        .features-list i {
          color: var(--secondary);
          font-size: 1.1rem;
        }

        @media (max-width: 992px) {
          .login-container {
            grid-template-columns: 1fr;
            max-width: 500px;
          }

          .login-right {
            display: none;
          }
        }
      `}</style>

      <div className="login-container">
        {/* LEFT */}
        <div className="login-left">
          <div className="logo">
            <i className="fas fa-home"></i> Imobi<span>Pro</span>
          </div>

          <h1>Bem-vindo de volta</h1>
          <p className="subtitle">Acesse sua conta ImobiPro</p>

          <div className={`error-message ${errorMessage ? 'show' : ''}`}>
            {errorMessage}
          </div>

          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button className="login-btn" disabled={loading}>
              <i className="fas fa-sign-in-alt"></i>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <h2>Um sistema completo para seu sucesso</h2>
          <p>
            Gerencie imóveis, clientes, vendas e tenha um site profissional integrado.
          </p>

          <ul className="features-list">
            <li><i className="fas fa-check-circle"></i> Dashboard com métricas em tempo real</li>
            <li><i className="fas fa-check-circle"></i> Gestão completa de portfólio</li>
            <li><i className="fas fa-check-circle"></i> CRM inteligente de clientes</li>
            <li><i className="fas fa-check-circle"></i> Site personalizado integrado</li>
            <li><i className="fas fa-check-circle"></i> Relatórios avançados</li>
            <li><i className="fas fa-check-circle"></i> Suporte especializado 24/7</li>
          </ul>
        </div>
      </div>
    </>
  )
}
