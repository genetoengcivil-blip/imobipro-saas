import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Search, MapPin, Bed, Bath, Maximize2, Phone, ArrowRight, ArrowLeft, Car, Heart, MessageCircle, Star, Shield, Clock, Award, ChevronRight, ChevronLeft, X, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Property, User } from '../types';
import { Logo } from '../components/Logo';

const SOCIAL_ICONS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  instagram: { icon: <Instagram className="w-4 h-4" />, color: '#E1306C', label: 'Instagram' },
  facebook:  { icon: <Facebook  className="w-4 h-4" />, color: '#1877F2', label: 'Facebook'  },
  youtube:   { icon: <Youtube   className="w-4 h-4" />, color: '#FF0000', label: 'YouTube'   },
  linkedin:  { icon: <Linkedin  className="w-4 h-4" />, color: '#0A66C2', label: 'LinkedIn'  },
  tiktok:    { icon: <span className="text-[11px] font-black">TK</span>, color: '#010101', label: 'TikTok' },
};

const SitePage: React.FC = () => {
  const { properties, user } = useGlobal();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'venda' | 'locação'>('todos');
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [detailImgIdx, setDetailImgIdx] = useState(0);
  const [legalModal, setLegalModal] = useState<'none' | 'termos' | 'privacidade'>('none');

  const socialEntries = Object.entries(user?.socialMedia || {}).filter(([, v]) => v);

  const available = properties.filter(p => p.status === 'disponível' || p.status === 'reservado');
  const featured = available.filter(p => p.featured);
  const filtered = available
    .filter(p => filter === 'todos' || p.type === filter)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()));

  const totalSold = properties.filter(p => p.status === 'vendido').length + 47;

  const openDetail = (prop: Property) => {
    setSelectedProp(prop);
    setDetailImgIdx(0);
  };

  const detailImages = selectedProp ? (selectedProp.images && selectedProp.images.length > 0 ? selectedProp.images : [selectedProp.image]) : [];

  return (
    <div className="bg-white min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-heavy border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-[16px] font-bold tracking-tight text-ink hidden sm:block">
                Imobi<span className="text-apple-blue">Pro</span>
              </span>
            </div>
            
            {(user?.logo || user?.company) && (
              <>
                <div className="w-px h-6 bg-black/[0.08]" />
                <div className="flex items-center gap-2.5">
                  {user?.logo ? (
                    <img src={user.logo} alt={user.company} className="w-9 h-9 rounded-full object-cover border border-black/[0.05] shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue font-bold text-[14px]">
                      {user?.company?.charAt(0) || 'P'}
                    </div>
                  )}
                  <span className="text-[15px] font-semibold text-ink-2 truncate max-w-[120px] sm:max-w-none">
                    {user?.company || 'Sua Empresa'}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Link to="/" className="text-[12px] text-ink-4 hover:text-apple-blue font-medium flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> CRM
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating WhatsApp Button */}
      <a 
        href={`https://wa.me/55${(user?.phone || '').replace(/\D/g, '')}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3"
      >
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-black/[0.05] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
          <p className="text-[13px] font-bold text-ink whitespace-nowrap">Fale comigo agora</p>
        </div>
        <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_12px_40px_rgba(37,211,102,0.5)] active:scale-95 transition-all duration-300 animate-bounce-subtle relative">
          <MessageCircle className="w-8 h-8 text-white fill-current" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">1</span>
        </div>
      </a>

      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center bg-ink overflow-hidden pt-16">
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Hero" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1D1D1F]/40 via-transparent to-[#1D1D1F]/80" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(10,132,255,0.08) 0%, transparent 60%)' }} />
        <div className="relative w-full max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-apple-green rounded-full animate-pulse" />
              <span className="text-[12px] text-white/40 font-semibold uppercase tracking-[0.1em]">Imóveis selecionados</span>
            </div>
            <h2 className="text-[44px] md:text-[60px] font-bold text-white tracking-tight leading-[1.05]">
              Encontre o lugar<br />
              <span className="bg-gradient-to-r from-apple-blue to-apple-teal bg-clip-text text-transparent">perfeito para viver</span>
            </h2>
            <p className="text-white/30 text-[16px] md:text-[18px] mt-5 max-w-lg leading-relaxed font-medium">
              Consultoria personalizada com os melhores imóveis da região. Experiência, confiança e resultado.
            </p>

            {/* Search */}
            <div className="mt-10 bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-2 rounded-[20px] max-w-xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 bg-white/[0.05] rounded-[14px]">
                  <Search className="w-5 h-5 text-white/30 shrink-0" />
                  <input type="text" placeholder="Buscar por localização..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full focus:outline-none text-white py-3.5 text-[15px] font-medium bg-transparent placeholder-white/20" />
                </div>
                <button onClick={() => document.getElementById('all-props')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-apple-blue text-white px-6 py-3.5 rounded-[14px] font-semibold text-[14px] flex items-center gap-2 hover:bg-[#0A78E8] transition-all shadow-[0_4px_16px_rgba(10,132,255,0.3)] shrink-0">
                  Buscar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trust stats */}
            <div className="flex gap-8 mt-12">
              {[
                { val: `${totalSold}+`, label: 'Vendidos' },
                { val: `${available.length}`, label: 'Disponíveis' },
                { val: '10+', label: 'Anos de exp.' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[28px] font-bold text-white tabular">{s.val}</p>
                  <p className="text-[11px] text-white/20 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-surface py-12 border-b border-separator">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Segurança', desc: 'Transações 100% seguras' },
              { icon: Award, title: 'Experiência', desc: 'Profissional certificado' },
              { icon: Clock, title: 'Agilidade', desc: 'Atendimento em até 1h' },
              { icon: Star, title: 'Qualidade', desc: 'Avaliação 5 estrelas' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-apple-blue" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-ink">{item.title}</p>
                  <p className="text-[12px] text-ink-4 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[12px] text-apple-blue font-semibold uppercase tracking-[0.08em]">Seleção especial</span>
              <h3 className="text-[32px] font-bold text-ink tracking-tight mt-1">Destaques</h3>
              <p className="text-ink-4 text-[15px] mt-1">Os melhores imóveis para você</p>
            </div>
            <button onClick={() => document.getElementById('all-props')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-soft !rounded-full !text-[13px] hidden md:flex">
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => <PropCard key={p.id} prop={p} user={user} onDetail={openDetail} featured />)}
          </div>
        </section>
      )}

      {/* All Properties */}
      <section id="all-props" className="bg-surface py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
            <div>
              <span className="text-[12px] text-apple-blue font-semibold uppercase tracking-[0.08em]">Portfólio completo</span>
              <h3 className="text-[32px] font-bold text-ink tracking-tight mt-1">Todos os Imóveis</h3>
              <p className="text-ink-4 text-[15px] mt-1">{filtered.length} disponíve{filtered.length !== 1 ? 'is' : 'l'}</p>
            </div>
            <div className="flex gap-2">
              {(['todos', 'venda', 'locação'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all capitalize ${
                    filter === f ? 'bg-ink text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'bg-white text-ink-3 hover:bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                  }`}>
                  {f === 'todos' ? 'Todos' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => <PropCard key={p.id} prop={p} user={user} onDetail={openDetail} />)}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-24">
              <p className="text-[18px] font-medium text-ink-3">Nenhum imóvel encontrado</p>
              <p className="text-[14px] text-ink-4 mt-1">Tente ajustar sua busca</p>
            </div>
          )}
        </div>
      </section>

      {/* About / CTA */}
      <section className="bg-ink py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(10,132,255,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-xl mx-auto text-center relative">
          {user?.logo ? (
            <div className="mx-auto mb-6 flex flex-col items-center gap-3">
              <img src={user.logo} alt={user?.company || 'Logo'} className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" />
              {user?.company && <p className="text-white/70 font-semibold text-[15px]">{user.company}</p>}
            </div>
          ) : (
            <div className="mx-auto mb-6 flex flex-col items-center gap-3">
              <div className="w-20 h-20 gradient-blue rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(10,132,255,0.3)]">
                <span className="text-white font-bold text-[28px]">{user?.company?.charAt(0) || 'P'}</span>
              </div>
              {user?.company && <p className="text-white/70 font-semibold text-[15px]">{user.company}</p>}
            </div>
          )}
          <h4 className="text-[32px] md:text-[40px] font-bold text-white tracking-tight leading-tight mb-4">
            Pronto para encontrar<br />seu novo lar?
          </h4>
          <p className="text-white/25 text-[16px] mb-8 font-medium leading-relaxed max-w-md mx-auto">
            Entre em contato e receba atendimento personalizado de um especialista.
          </p>

          {/* Social links in CTA */}
          {socialEntries.length > 0 && (
            <div className="flex items-center justify-center gap-3 mb-8">
              {socialEntries.map(([key, val]) => {
                const s = SOCIAL_ICONS[key]; if (!s) return null;
                const href = (val as string).startsWith('http') ? (val as string) : `https://${val}`;
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={s.label}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white"
                    style={{ background: `${s.color}30`, border: `1px solid ${s.color}40` }}>
                    {s.icon}
                  </a>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a href={`tel:${user?.phone}`}
              className="bg-white/[0.06] border border-white/[0.08] text-white px-8 py-4 rounded-[16px] font-semibold hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2.5 text-[15px]">
              <Phone className="w-5 h-5" /> Ligar Agora
            </a>
            <a href={`https://wa.me/55${(user?.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="bg-apple-green text-white px-8 py-4 rounded-[16px] font-semibold hover:bg-[#2BC350] transition-all flex items-center justify-center gap-2.5 text-[15px] shadow-[0_4px_20px_rgba(48,209,88,0.3)]">
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#161617] pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Logo size={24} />
                <span className="text-[18px] font-bold text-white tracking-tight">Imobi<span className="text-apple-blue">Pro</span></span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {user?.logo ? (
                  <img src={user.logo} alt={user?.company || 'Logo'} className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-apple-blue/20 flex items-center justify-center text-apple-blue font-bold text-[18px]">
                    {user?.company?.charAt(0) || 'P'}
                  </div>
                )}
                <div>
                  <p className="text-[16px] text-white font-bold">{user?.company || 'ImobiPro'}</p>
                  <p className="text-[12px] text-white/40 mt-0.5">{user?.creci || 'CRECI não informado'}</p>
                </div>
              </div>
            </div>

            {/* Social icons in footer */}
            {socialEntries.length > 0 && (
              <div className="flex items-center gap-3">
                {socialEntries.map(([key, val]) => {
                  const s = SOCIAL_ICONS[key]; if (!s) return null;
                  const href = (val as string).startsWith('http') ? (val as string) : `https://${val}`;
                  return (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={s.label}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white/50 hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {s.icon}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Contact */}
            <div className="text-center md:text-right">
              {user?.email && <p className="text-[13px] text-white/30">{user.email}</p>}
              {user?.phone && <p className="text-[13px] text-white/30 mt-0.5">{user.phone}</p>}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6">
            <p className="text-[12px] text-white/20">&copy; {new Date().getFullYear()} {user?.company || 'ImobiPro'} — Todos os direitos reservados</p>
            <div className="flex items-center gap-5">
              <button onClick={() => setLegalModal('termos')} className="text-[12px] text-white/25 hover:text-white/50 transition-colors">Termos de Uso</button>
              <button onClick={() => setLegalModal('privacidade')} className="text-[12px] text-white/25 hover:text-white/50 transition-colors">Política de Privacidade</button>
              <p className="text-[11px] text-white/[0.08]">Powered by ImobiPro</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      {legalModal !== 'none' && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setLegalModal('none')} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-[24px]">
                <h3 className="text-[18px] font-bold text-ink">
                  {legalModal === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
                </h3>
                <button onClick={() => setLegalModal('none')} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-5 text-[14px] text-gray-600 leading-relaxed">
                {legalModal === 'termos' ? (
                  <>
                    <div><p className="text-[12px] text-gray-400 mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p></div>
                    {[
                      { title: '1. Aceitação dos Termos', body: `Ao acessar e utilizar este site, você concorda com os presentes Termos de Uso. Este site é operado por ${user?.company || 'nosso escritório imobiliário'} e tem como objetivo apresentar imóveis disponíveis para venda e locação.` },
                      { title: '2. Uso do Site', body: 'Este site é destinado exclusivamente para fins informativos e de contato. É proibido utilizar o site para qualquer atividade ilegal, fraudulenta ou que viole direitos de terceiros. As informações sobre os imóveis são fornecidas de boa-fé e podem estar sujeitas a alterações sem aviso prévio.' },
                      { title: '3. Informações dos Imóveis', body: 'As informações, preços e disponibilidade dos imóveis apresentados neste site são meramente informativos e estão sujeitos a alterações. A confirmação de disponibilidade e valores deve ser feita diretamente com o corretor responsável.' },
                      { title: '4. Contato e Comunicação', body: 'Ao entrar em contato através dos meios disponíveis neste site (WhatsApp, telefone ou e-mail), você concorda em receber comunicações relacionadas aos seus interesses imobiliários. Você pode solicitar a cessação dessas comunicações a qualquer momento.' },
                      { title: '5. Propriedade Intelectual', body: 'Todo o conteúdo deste site, incluindo textos, imagens e logotipos, é propriedade do corretor e está protegido por leis de direitos autorais. É proibida a reprodução sem autorização prévia.' },
                      { title: '6. Limitação de Responsabilidade', body: 'Não nos responsabilizamos por danos diretos ou indiretos decorrentes do uso deste site ou das informações nele contidas. As negociações imobiliárias estão sujeitas às condições acordadas entre as partes.' },
                      { title: '7. Alterações nos Termos', body: 'Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento. As alterações entram em vigor imediatamente após a publicação neste site.' },
                    ].map(section => (
                      <div key={section.title}>
                        <h4 className="text-[15px] font-bold text-ink mb-2">{section.title}</h4>
                        <p>{section.body}</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[13px] text-gray-500">Em caso de dúvidas, entre em contato: <strong>{user?.email || 'contato@empresa.com'}</strong></p>
                    </div>
                  </>
                ) : (
                  <>
                    <div><p className="text-[12px] text-gray-400 mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p></div>
                    {[
                      { title: '1. Informações que Coletamos', body: 'Coletamos apenas as informações que você nos fornece voluntariamente ao entrar em contato, como nome, telefone e e-mail. Não coletamos dados sem o seu consentimento explícito.' },
                      { title: '2. Como Usamos suas Informações', body: 'As informações coletadas são utilizadas exclusivamente para: responder às suas solicitações sobre imóveis, enviar informações relevantes sobre propriedades do seu interesse e melhorar o atendimento prestado.' },
                      { title: '3. Compartilhamento de Dados', body: `Suas informações pessoais não são vendidas, trocadas ou transferidas para terceiros sem o seu consentimento, exceto quando necessário para cumprir obrigações legais ou completar uma transação imobiliária com sua autorização. ${user?.company || 'Nossa empresa'} é a única responsável pelo tratamento desses dados.` },
                      { title: '4. Cookies e Tecnologias', body: 'Este site pode utilizar cookies para melhorar a experiência do usuário. Esses dados são anônimos e utilizados apenas para fins estatísticos e de melhoria do site.' },
                      { title: '5. Segurança dos Dados', body: 'Adotamos medidas de segurança adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.' },
                      { title: '6. Seus Direitos (LGPD)', body: 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), você tem direito a: acessar seus dados pessoais, corrigir dados incompletos ou incorretos, solicitar a exclusão dos seus dados, e revogar o consentimento a qualquer momento.' },
                      { title: '7. Retenção de Dados', body: 'Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, respeitando os prazos legais aplicáveis.' },
                      { title: '8. Contato DPO', body: `Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados pessoais, entre em contato: ${user?.email || 'privacidade@empresa.com'} | ${user?.phone || '(11) 99999-9999'}` },
                    ].map(section => (
                      <div key={section.title}>
                        <h4 className="text-[15px] font-bold text-ink mb-2">{section.title}</h4>
                        <p>{section.body}</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[13px] text-gray-500">Esta política está em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}


      {/* Property Detail Modal */}
      {selectedProp && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] animate-fade" onClick={() => setSelectedProp(null)} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale">
              {/* Image Gallery */}
              <div className="relative h-[300px] md:h-[380px] overflow-hidden rounded-t-[24px] bg-black">
                <img
                  src={detailImages[detailImgIdx] || selectedProp.image}
                  alt={selectedProp.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                <button onClick={() => setSelectedProp(null)}
                  className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-all z-10">
                  <X className="w-5 h-5 text-ink" />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${selectedProp.type === 'venda' ? 'bg-white/90 text-ink' : 'bg-apple-green text-white'}`}>{selectedProp.type}</span>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-md ${selectedProp.status === 'disponível' ? 'bg-apple-green/20 text-apple-green' : selectedProp.status === 'reservado' ? 'bg-apple-orange/20 text-apple-orange' : 'bg-apple-blue/20 text-apple-blue'}`}>{selectedProp.status}</span>
                </div>

                {/* Gallery nav */}
                {detailImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setDetailImgIdx(i => i > 0 ? i - 1 : detailImages.length - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/70 backdrop-blur rounded-full hover:bg-white/90 transition-all z-10">
                      <ChevronLeft className="w-5 h-5 text-ink" />
                    </button>
                    <button
                      onClick={() => setDetailImgIdx(i => i < detailImages.length - 1 ? i + 1 : 0)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/70 backdrop-blur rounded-full hover:bg-white/90 transition-all z-10">
                      <ChevronRight className="w-5 h-5 text-ink" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {detailImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDetailImgIdx(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === detailImgIdx ? 'bg-white w-6' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {detailImages.length > 1 && (
                <div className="flex gap-2 px-6 -mt-6 relative z-10">
                  {detailImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDetailImgIdx(idx)}
                      className={`w-16 h-12 rounded-[10px] overflow-hidden border-2 transition-all shrink-0 ${idx === detailImgIdx ? 'border-apple-blue shadow-lg scale-105' : 'border-white/80 opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-[26px] font-bold text-ink tracking-tight">{selectedProp.title}</h3>
                  <p className="text-[14px] text-ink-4 flex items-center gap-1.5 mt-2"><MapPin className="w-4 h-4" /> {selectedProp.location}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <p className="text-[38px] font-bold text-ink tabular">R$ {selectedProp.price.toLocaleString('pt-BR')}</p>
                  {selectedProp.type === 'locação' && <span className="text-[14px] text-ink-4 font-medium">/mês</span>}
                </div>

                {/* Description */}
                <div className="bg-surface rounded-[16px] p-5">
                  <p className="text-[11px] text-ink-4 font-semibold uppercase tracking-[0.04em] mb-2">Descrição</p>
                  <p className="text-[14px] text-ink-3 leading-relaxed">{selectedProp.description}</p>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Bed, val: selectedProp.bedrooms, label: 'Quartos' },
                    { icon: Bath, val: selectedProp.bathrooms, label: 'Banheiros' },
                    { icon: Maximize2, val: `${selectedProp.area}m²`, label: 'Área' },
                    { icon: Car, val: selectedProp.garage, label: 'Vagas' },
                  ].map(item => (
                    <div key={item.label} className="bg-surface rounded-[14px] p-4 text-center">
                      <item.icon className="w-5 h-5 text-apple-blue mx-auto mb-2" />
                      <p className="text-[18px] font-bold text-ink">{item.val}</p>
                      <p className="text-[10px] text-ink-4 font-medium mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a href={`https://wa.me/55${(user?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${selectedProp.title} - R$ ${selectedProp.price.toLocaleString('pt-BR')}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-apple-green text-white py-4 rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:bg-[#2BC350] transition-all shadow-[0_4px_16px_rgba(48,209,88,0.25)]">
                    <MessageCircle className="w-5 h-5" /> Tenho Interesse
                  </a>
                  <a href={`tel:${user?.phone}`}
                    className="flex-1 bg-surface text-ink py-4 rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:bg-ink-5/30 transition-all">
                    <Phone className="w-5 h-5" /> Ligar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PropCard: React.FC<{ prop: Property; user: User | null; featured?: boolean; onDetail: (p: Property) => void }> = ({ prop, user, featured: isFeatured, onDetail }) => {
  const [liked, setLiked] = useState(false);
  const images = prop.images && prop.images.length > 0 ? prop.images : [prop.image];

  return (
    <div
      onClick={() => onDetail(prop)}
      className={`group cursor-pointer bg-white rounded-[20px] overflow-hidden transition-all duration-500 ${isFeatured ? 'shadow-[0_4px_24px_rgba(0,0,0,0.06)]' : 'shadow-[0_1px_6px_rgba(0,0,0,0.04)]'} hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1`}
    >
      <div className="relative h-[240px] overflow-hidden">
        <img src={prop.image} alt={prop.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${prop.type === 'venda' ? 'bg-white/90 text-ink' : 'bg-apple-green text-white'}`}>{prop.type}</span>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          {images.length > 1 && (
            <span className="px-2.5 py-1.5 backdrop-blur-md bg-black/30 text-white text-[10px] font-bold rounded-full">{images.length} fotos</span>
          )}
          <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className={`p-2.5 backdrop-blur-md rounded-full transition-all ${liked ? 'bg-apple-pink/90 text-white' : 'bg-white/80 text-ink-4 hover:text-apple-pink'}`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4">
          <p className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-[12px] text-[20px] font-bold text-ink tabular shadow-sm">
            R$ {prop.price.toLocaleString('pt-BR')}
            {prop.type === 'locação' && <span className="text-[12px] text-ink-4 font-medium">/mês</span>}
          </p>
        </div>
      </div>
      <div className="p-5">
        <h4 className="text-[16px] font-bold text-ink leading-tight clamp-1">{prop.title}</h4>
        <p className="text-[12px] text-ink-4 flex items-center gap-1.5 mt-2"><MapPin className="w-3.5 h-3.5" /> {prop.location}</p>
        <p className="text-[12px] text-ink-4 mt-2 clamp-2 leading-relaxed">{prop.description}</p>
        <div className="flex gap-5 mt-4 pt-4 border-t border-separator text-[12px] text-ink-3 font-medium">
          <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-apple-blue" />{prop.bedrooms}</span>
          <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-apple-blue" />{prop.bathrooms}</span>
          <span className="flex items-center gap-1.5"><Maximize2 className="w-4 h-4 text-apple-blue" />{prop.area}m²</span>
          {prop.garage > 0 && <span className="flex items-center gap-1.5"><Car className="w-4 h-4 text-apple-blue" />{prop.garage}</span>}
        </div>
        <a href={`https://wa.me/55${(user?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${prop.title}`)}`}
          target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="mt-4 w-full bg-apple-green/[0.06] text-apple-green py-3.5 rounded-[14px] font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-apple-green/[0.12] transition-colors">
          <MessageCircle className="w-4 h-4" /> Tenho Interesse
        </a>
      </div>
    </div>
  );
};

export default SitePage;
