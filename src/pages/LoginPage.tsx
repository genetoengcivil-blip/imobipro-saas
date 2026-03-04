import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useGlobal();
  const nav = useNavigate();

  const go = (e: string, p: string) => {
    setLoading(true);
    setTimeout(() => { login(e, p); nav('/'); }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) go(email, password);
  };

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-apple-blue/15 blur-[120px] animate-fade" />
      <div className="absolute bottom-[-150px] right-[-80px] w-[450px] h-[450px] rounded-full bg-apple-indigo/12 blur-[100px] animate-fade delay-2" />
      <div className="absolute top-1/3 right-[-50px] w-[300px] h-[300px] rounded-full bg-apple-green/8 blur-[80px] animate-fade delay-4" />

      {/* Left — Branding (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-16 relative z-10">
        <div className="max-w-md animate-slide-up">

          {/* Logo + Name side by side */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-[64px] h-[64px] bg-black rounded-[18px] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 shrink-0 overflow-hidden p-2">
              <Logo size={48} />
            </div>
            <div>
              <p className="text-[36px] font-bold tracking-tight leading-none">
                <span className="text-white">Imobi</span><span style={{ color: '#0A84FF' }}>Pro</span>
              </p>
              <p className="text-[13px] text-white/30 font-medium mt-1.5">CRM Inteligente para Corretores</p>
            </div>
          </div>

          <h1 className="text-[44px] font-bold text-white tracking-tight leading-[1.08] mb-4">
            Venda mais.<br />
            <span className="text-white/35">Perca menos.</span>
          </h1>
          <p className="text-[17px] text-white/30 leading-relaxed max-w-sm">
            O CRM que transforma seus contatos em vendas organizadas e previsíveis. Sem complexidade.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-12">
            {[
              { n: '10x', t: 'Mais organização' },
              { n: '30%', t: 'Mais conversão' },
              { n: '2min', t: 'Para começar' },
            ].map(s => (
              <div key={s.n}>
                <p className="text-[30px] font-bold text-white tabular">{s.n}</p>
                <p className="text-[12px] text-white/25 font-medium mt-0.5">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10 lg:max-w-[520px]">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10 animate-fade">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-black rounded-[14px] flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.2)] border border-white/5 overflow-hidden p-1.5">
                <Logo size={32} />
              </div>
              <p className="text-[28px] font-bold tracking-tight">
                <span className="text-white">Imobi</span><span style={{ color: '#0A84FF' }}>Pro</span>
              </p>
            </div>
            <p className="text-[13px] text-white/30 font-medium">CRM Inteligente para Corretores</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.05] border border-white/[0.07] rounded-[20px] p-7 animate-slide-up delay-1">
            <h2 className="text-[22px] font-bold text-white mb-1 hidden lg:block">Bem-vindo</h2>
            <p className="text-[14px] text-white/30 mb-7 hidden lg:block">Entre para continuar</p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[11px] font-semibold text-white/25 uppercase tracking-[0.06em] mb-2 ml-0.5">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.07] rounded-[12px] text-white placeholder-white/15 focus:outline-none focus:border-apple-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.1)] transition-all text-[15px] font-medium"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/25 uppercase tracking-[0.06em] mb-2 ml-0.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 bg-white/[0.05] border border-white/[0.07] rounded-[12px] text-white placeholder-white/15 focus:outline-none focus:border-apple-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.1)] transition-all text-[15px] font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 bg-apple-blue rounded-[12px] text-white font-semibold text-[15px] hover:bg-[#0A78E8] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(10,132,255,0.3)] mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Entrar <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-white/10 mt-8 font-medium">
            © {new Date().getFullYear()} ImobiPro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
