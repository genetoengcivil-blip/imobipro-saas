import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Users, Building2, TrendingUp, ChevronRight, Plus, Clock, AlertTriangle, MessageSquare, Phone, Wallet, CalendarDays, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LEAD_STATUSES, STATUS_COLORS } from '../types';

const fmt = (n: number) => n >= 1000000 ? `R$ ${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${n}`;

const DashboardPage: React.FC = () => {
  const { user, leads, properties, transactions, appointments, darkMode } = useGlobal();
  const t = new Date().toISOString().split('T')[0];

  const active = leads.filter(l => l.status !== 'fechado').length;
  const closed = leads.filter(l => l.status === 'fechado').length;
  const totalComm = leads.filter(l => l.status === 'fechado').reduce((s, l) => s + l.commission, 0);
  const rate = leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0;
  const todayAppts = appointments.filter(a => a.date === t && !a.completed);
  const overdue = leads.filter(l => l.nextFollowUp && l.nextFollowUp <= t && l.status !== 'fechado');
  const income = transactions.filter(x => x.type === 'receita').reduce((s, x) => s + x.amount, 0);
  const expenses = transactions.filter(x => x.type === 'despesa').reduce((s, x) => s + x.amount, 0);
  const pipeline = leads.filter(l => l.status !== 'fechado').reduce((s, l) => s + l.value, 0);
  const firstName = user?.name.split(' ')[0] || 'Corretor';

  const funnel = LEAD_STATUSES.map(s => ({
    ...s, count: leads.filter(l => l.status === s.id).length,
    value: leads.filter(l => l.status === s.id).reduce((sum, l) => sum + l.value, 0),
  }));
  const maxF = Math.max(...funnel.map(f => f.count), 1);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const circumference = 2 * Math.PI * 42;
  const rateOffset = circumference - (rate / 100) * circumference;

  // Dark mode aware colors
  const c = {
    text: darkMode ? '#F5F5F7' : '#1D1D1F',
    textSec: darkMode ? '#8E8E93' : '#AEAEB2',
    textMut: darkMode ? '#636366' : '#6E6E73',
    cardBg: darkMode ? '#1C1C1E' : '#FFFFFF',
    surfaceBg: darkMode ? '#2C2C2E' : '#F5F5F7',
    border: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    ringTrack: darkMode ? '#2C2C2E' : '#F5F5F7',
  };

  return (
    <div className="page space-y-6 lg:max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-start animate-fade">
        <div>
          <p className="text-[13px] font-medium" style={{ color: c.textSec }}>{greeting}</p>
          <h2 className="text-[30px] font-bold tracking-tight leading-tight mt-0.5" style={{ color: c.text }}>{firstName} 👋</h2>
        </div>
        <Link to="/leads/new"
          className="btn btn-primary !p-3.5 !rounded-[16px] shadow-[0_4px_20px_rgba(10,132,255,0.25)] animate-glow">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Alerts */}
      {(todayAppts.length > 0 || overdue.length > 0) && (
        <div className="flex gap-3 flex-wrap animate-slide-up delay-1">
          {todayAppts.length > 0 && (
            <Link to="/calendar" className="flex-1 min-w-[200px] flex items-center gap-3 bg-apple-blue/[0.05] border border-apple-blue/[0.08] px-4 py-3.5 rounded-[16px] group transition-all hover:bg-apple-blue/[0.08]">
              <div className="w-10 h-10 rounded-[12px] bg-apple-blue/10 flex items-center justify-center">
                <CalendarDays className="w-[18px] h-[18px] text-apple-blue" />
              </div>
              <div className="flex-1">
                <span className="text-[13px] font-semibold text-apple-blue">{todayAppts.length} compromisso{todayAppts.length > 1 ? 's' : ''}</span>
                <p className="text-[11px] text-apple-blue/50 font-medium">Hoje</p>
              </div>
              <ChevronRight className="w-4 h-4 text-apple-blue/30 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {overdue.length > 0 && (
            <Link to="/leads" className="flex-1 min-w-[200px] flex items-center gap-3 bg-apple-orange/[0.05] border border-apple-orange/[0.08] px-4 py-3.5 rounded-[16px] group transition-all hover:bg-apple-orange/[0.08]">
              <div className="w-10 h-10 rounded-[12px] bg-apple-orange/10 flex items-center justify-center">
                <AlertTriangle className="w-[18px] h-[18px] text-apple-orange" />
              </div>
              <div className="flex-1">
                <span className="text-[13px] font-semibold text-apple-orange">{overdue.length} follow-up{overdue.length > 1 ? 's' : ''}</span>
                <p className="text-[11px] text-apple-orange/50 font-medium">Atrasado{overdue.length > 1 ? 's' : ''}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-apple-orange/30 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Hero Revenue + Conversion Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-up delay-2">
        {/* Revenue Card — light mode: white card, dark mode: premium dark */}
        <div
          className="lg:col-span-2 relative overflow-hidden rounded-[24px] p-7"
          style={{
            background: darkMode
              ? 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)'
              : '#FFFFFF',
            boxShadow: darkMode
              ? '0 0 0 0.5px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4)'
              : '0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Decorative blobs — blue in light, subtle in dark */}
          <div className="absolute top-[-60px] right-[-40px] w-[280px] h-[280px] rounded-full blur-[100px]"
            style={{ background: darkMode ? 'rgba(10,132,255,0.12)' : 'rgba(10,132,255,0.07)' }} />
          <div className="absolute bottom-[-80px] left-[-30px] w-[200px] h-[200px] rounded-full blur-[80px]"
            style={{ background: darkMode ? 'rgba(94,92,230,0.10)' : 'rgba(94,92,230,0.05)' }} />

          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>
                  Saldo Líquido (Lucro)
                </p>
                <h3 className="text-[42px] font-bold tracking-tight mt-1 tabular leading-none"
                  style={{ color: darkMode ? '#FFFFFF' : '#1D1D1F' }}>
                  {fmt(income - expenses)}
                </h3>
              </div>
              <Link to="/financial"
                className="p-3.5 rounded-[14px] transition-colors"
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}>
                <Wallet className="w-6 h-6" style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-[16px] p-4"
                style={{ 
                  background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-apple-green/15 flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-apple-green" />
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-[0.06em]"
                    style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>
                    Receitas
                  </span>
                </div>
                <p className="text-[20px] font-bold tabular" style={{ color: darkMode ? 'white' : '#1D1D1F' }}>
                  {fmt(income)}
                </p>
              </div>

              <div className="rounded-[16px] p-4"
                style={{ 
                  background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-apple-red/15 flex items-center justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5 text-apple-red" />
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-[0.06em]"
                    style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>
                    Despesas
                  </span>
                </div>
                <p className="text-[20px] font-bold tabular" style={{ color: darkMode ? 'white' : '#1D1D1F' }}>
                  {fmt(expenses)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: 'Pipeline', val: fmt(pipeline), icon: Target },
                { label: 'Comissões', val: fmt(totalComm), icon: Wallet },
                { label: 'Conversão', val: `${rate}%`, icon: TrendingUp },
              ].map((m, i) => (
                <div key={m.label} className={`rounded-[14px] p-3.5 animate-count delay-${i + 3}`}
                  style={{
                    background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                  }}>
                  <m.icon className="w-3.5 h-3.5 mb-2"
                    style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }} />
                  <p className="text-[17px] font-bold tabular"
                    style={{ color: darkMode ? '#FFFFFF' : '#1D1D1F' }}>
                    {m.val}
                  </p>
                  <p className="text-[9px] uppercase font-semibold tracking-[0.06em] mt-0.5"
                    style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}>
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Ring */}
        <div className="rounded-[20px] p-6 flex flex-col items-center justify-center" style={{ background: c.cardBg, boxShadow: darkMode ? '0 0 0 0.5px rgba(255,255,255,0.06)' : '0 0 0 0.5px rgba(0,0,0,0.03), 0 4px 12px -2px rgba(0,0,0,0.04)' }}>
          <div className="relative">
            <svg width="110" height="110" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke={c.ringTrack} strokeWidth="7" />
              <circle cx="50" cy="50" r="42" className="ring-progress" stroke="#0A84FF" strokeWidth="7"
                strokeDasharray={circumference} strokeDashoffset={rateOffset}
                transform="rotate(-90 50 50)" style={{ animation: 'progress-ring 1.2s ease-out both' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold tabular" style={{ color: c.text }}>{rate}%</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.06em]" style={{ color: c.textSec }}>Conversão</span>
            </div>
          </div>
          <div className="flex gap-6 mt-5">
            <div className="text-center">
              <p className="text-[18px] font-bold tabular" style={{ color: c.text }}>{active}</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.06em]" style={{ color: c.textSec }}>Ativos</p>
            </div>
            <div className="w-px h-8 self-center" style={{ background: c.border }} />
            <div className="text-center">
              <p className="text-[18px] font-bold text-apple-green tabular">{closed}</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.06em]" style={{ color: c.textSec }}>Fechados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up delay-3">
        {[
          { icon: Users, color: 'text-apple-blue', bg: 'bg-apple-blue/[0.06]', label: 'Leads Ativos', val: active.toString() },
          { icon: Building2, color: 'text-apple-indigo', bg: 'bg-apple-indigo/[0.06]', label: 'Imóveis', val: properties.length.toString() },
          { icon: CalendarDays, color: 'text-apple-orange', bg: 'bg-apple-orange/[0.06]', label: 'Agenda Hoje', val: todayAppts.length.toString() },
          { icon: Clock, color: 'text-apple-pink', bg: 'bg-apple-pink/[0.06]', label: 'Follow-ups', val: overdue.length.toString() },
        ].map((s, i) => (
          <div key={s.label} className={`rounded-[20px] p-5 group animate-slide-up delay-${i + 4}`}
            style={{ background: c.cardBg, boxShadow: darkMode ? '0 0 0 0.5px rgba(255,255,255,0.06)' : '0 0 0 0.5px rgba(0,0,0,0.03), 0 4px 12px -2px rgba(0,0,0,0.04)' }}>
            <div className={`metric-icon ${s.bg} ${s.color} mb-3`}>
              <s.icon className="w-[20px] h-[20px]" />
            </div>
            <p className="text-[11px] font-medium" style={{ color: c.textSec }}>{s.label}</p>
            <p className="text-[26px] font-bold tracking-tight mt-0.5 tabular leading-none" style={{ color: c.text }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="rounded-[20px] p-6 animate-slide-up delay-5" style={{ background: c.cardBg, boxShadow: darkMode ? '0 0 0 0.5px rgba(255,255,255,0.06)' : '0 0 0 0.5px rgba(0,0,0,0.03), 0 4px 12px -2px rgba(0,0,0,0.04)' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight" style={{ color: c.text }}>Funil de Vendas</h3>
            <p className="text-[12px] mt-0.5" style={{ color: c.textSec }}>{leads.length} leads no total</p>
          </div>
          <Link to="/pipeline" className="btn btn-soft !text-[12px] !py-2 !px-4 !rounded-[10px]">
            Ver Pipeline <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3.5">
          {funnel.map((stage, i) => {
            const w = Math.max((stage.count / maxF) * 100, 4);
            const sc = STATUS_COLORS[stage.id];
            return (
              <div key={stage.id} className={`flex items-center gap-4 animate-slide-right delay-${i + 1}`}>
                <div className="w-28 flex items-center gap-2 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sc.light }} />
                  <span className="text-[12px] font-medium truncate" style={{ color: darkMode ? '#D1D1D6' : '#424245' }}>{stage.label}</span>
                </div>
                <div className="flex-1 h-[32px] rounded-[10px] overflow-hidden relative" style={{ background: c.surfaceBg }}>
                  <div className="h-full rounded-[10px] flex items-center transition-all duration-700" style={{ width: `${w}%`, backgroundColor: sc.light, animation: 'bar-grow 0.8s ease-out both', animationDelay: `${i * 100}ms` }}>
                    {stage.count > 0 && <span className="text-[11px] font-bold text-white ml-3 tabular">{stage.count}</span>}
                  </div>
                </div>
                <p className="text-[12px] font-semibold w-20 text-right tabular" style={{ color: c.textMut }}>{fmt(stage.value)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Leads */}
        <div className="rounded-[20px] overflow-hidden animate-slide-up delay-6" style={{ background: c.cardBg, boxShadow: darkMode ? '0 0 0 0.5px rgba(255,255,255,0.06)' : '0 0 0 0.5px rgba(0,0,0,0.03), 0 4px 12px -2px rgba(0,0,0,0.04)' }}>
          <div className="flex justify-between items-center p-6 pb-3">
            <h3 className="text-[17px] font-bold tracking-tight" style={{ color: c.text }}>Últimos Leads</h3>
            <Link to="/leads" className="text-[12px] text-apple-blue font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all hover-underline">
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div>
            {leads.slice(0, 5).map((lead, i) => {
              const sc = STATUS_COLORS[lead.status];
              const gradients = ['gradient-blue', 'gradient-purple', 'gradient-orange', 'gradient-pink', 'gradient-green'];
              const grad = gradients[lead.name.charCodeAt(0) % gradients.length];
              return (
                <div key={lead.id} className="flex items-center gap-3.5 px-6 py-3.5 transition-colors" style={{ borderTop: i > 0 ? `1px solid ${c.border}` : 'none' }}>
                  <div className={`avatar avatar-sm ${grad}`}>
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold truncate" style={{ color: c.text }}>{lead.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.light }} />
                      <span className="text-[11px]" style={{ color: c.textSec }}>{lead.source}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 text-apple-green hover:bg-apple-green/[0.06] rounded-[10px] transition-all">
                      <MessageSquare className="w-4 h-4" />
                    </a>
                    <a href={`tel:${lead.phone}`} className="p-2 text-apple-blue hover:bg-apple-blue/[0.06] rounded-[10px] transition-all">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
            {leads.length === 0 && (
              <div className="empty-state py-12">
                <p className="text-[14px]" style={{ color: c.textSec }}>Nenhum lead cadastrado</p>
                <Link to="/leads/new" className="text-apple-blue font-semibold text-[13px] mt-2 inline-block">+ Adicionar lead</Link>
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="rounded-[20px] overflow-hidden animate-slide-up delay-7" style={{ background: c.cardBg, boxShadow: darkMode ? '0 0 0 0.5px rgba(255,255,255,0.06)' : '0 0 0 0.5px rgba(0,0,0,0.03), 0 4px 12px -2px rgba(0,0,0,0.04)' }}>
          <div className="flex justify-between items-center p-6 pb-3">
            <h3 className="text-[17px] font-bold tracking-tight" style={{ color: c.text }}>Agenda de Hoje</h3>
            <Link to="/calendar" className="text-[12px] text-apple-blue font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all hover-underline">
              Ver tudo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {todayAppts.length > 0 ? (
            <div className="px-6 pb-4 space-y-3">
              {todayAppts.map(a => {
                const typeColors: Record<string, string> = {
                  visita: 'bg-apple-blue', 'reunião': 'bg-apple-indigo',
                  'follow-up': 'bg-apple-orange', assinatura: 'bg-apple-green'
                };
                return (
                  <div key={a.id} className="flex items-center gap-4 rounded-[14px] px-4 py-3.5" style={{ background: c.surfaceBg }}>
                    <div className="text-center min-w-[48px]">
                      <p className="text-[16px] font-bold tabular" style={{ color: c.text }}>{a.time}</p>
                    </div>
                    <div className={`w-[3px] h-8 rounded-full ${typeColors[a.type] || 'bg-apple-blue'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: c.text }}>{a.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: c.textSec }}>{a.leadName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state py-12">
              <CalendarDays className="w-8 h-8 mb-3" style={{ color: darkMode ? '#48484A' : '#D2D2D7' }} />
              <p className="text-[14px]" style={{ color: c.textSec }}>Sem compromissos hoje</p>
              <Link to="/calendar" className="text-apple-blue font-semibold text-[13px] mt-2 inline-block">+ Agendar</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
