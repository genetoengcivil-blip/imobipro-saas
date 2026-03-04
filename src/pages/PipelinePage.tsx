import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { LEAD_STATUSES, STATUS_COLORS, LeadStatus } from '../types';
import { Phone, MessageSquare, Plus, ChevronRight, ChevronLeft, ArrowLeft, User, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getThemeColors } from '../utils/theme';

const PipelinePage: React.FC = () => {
  const { leads, moveLead, darkMode } = useGlobal();
  const nav = useNavigate();
  const order: LeadStatus[] = ['novo', 'contato', 'visita', 'proposta', 'fechado'];
  const [activeTab, setActiveTab] = useState<LeadStatus>('novo');
  const tc = getThemeColors(darkMode);

  const fmt = (n: number) =>
    n >= 1000000 ? `R$${(n / 1000000).toFixed(1)}M` :
    n >= 1000 ? `R$${(n / 1000).toFixed(0)}k` :
    `R$${n}`;

  const totalOpen = leads.filter(l => l.status !== 'fechado').reduce((s, l) => s + l.value, 0);
  const totalClosed = leads.filter(l => l.status === 'fechado').reduce((s, l) => s + l.value, 0);
  const activeItems = leads.filter(l => l.status === activeTab);
  const sc = STATUS_COLORS[activeTab];

  // Desktop: full kanban. Mobile: tabbed single column.
  return (
    <div className="h-full flex flex-col animate-fade">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3 shrink-0 z-10 backdrop-blur-xl"
        style={{
          background: darkMode ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.92)',
          borderBottom: `1px solid ${tc.border}`,
        }}
      >
        <button
          onClick={() => nav(-1)}
          className="p-2 rounded-[10px] transition-colors"
          style={{ background: tc.surfaceBg, color: tc.text }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold" style={{ color: tc.text }}>Pipeline</h2>
          <p className="text-[12px] font-medium" style={{ color: tc.textSec }}>
            {fmt(totalOpen)} em aberto · {fmt(totalClosed)} fechado
          </p>
        </div>
        <Link
          to="/leads/new"
          className="btn btn-primary !py-2.5 !px-4 !rounded-[12px] !text-[13px] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Novo Lead
        </Link>
      </div>

      {/* Summary Row — visible on mobile */}
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0 lg:hidden"
        style={{ borderBottom: `1px solid ${tc.border}` }}
      >
        {LEAD_STATUSES.map(col => {
          const count = leads.filter(l => l.status === col.id).length;
          const val = leads.filter(l => l.status === col.id).reduce((s, l) => s + l.value, 0);
          const isSel = activeTab === col.id;
          const csc = STATUS_COLORS[col.id];
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className="shrink-0 rounded-[14px] px-4 py-3 text-left transition-all"
              style={{
                background: isSel
                  ? (darkMode ? csc.light + '22' : csc.light + '15')
                  : tc.surfaceBg,
                border: isSel ? `1.5px solid ${csc.light}40` : `1.5px solid transparent`,
                minWidth: 110,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: csc.light }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.04em]" style={{ color: isSel ? csc.light : tc.textSec }}>
                  {col.label}
                </span>
              </div>
              <p className="text-[18px] font-bold tabular" style={{ color: tc.text }}>{count}</p>
              <p className="text-[10px] font-medium tabular mt-0.5" style={{ color: tc.textMut }}>{fmt(val)}</p>
            </button>
          );
        })}
      </div>

      {/* MOBILE: Single column view */}
      <div className="flex-1 overflow-y-auto lg:hidden px-4 py-4 space-y-3">
        {activeItems.length === 0 ? (
          <div
            className="rounded-[20px] border-2 border-dashed p-12 text-center mt-8"
            style={{ borderColor: tc.border }}
          >
            <div className="w-14 h-14 rounded-[18px] mx-auto mb-4 flex items-center justify-center"
              style={{ background: tc.surfaceBg }}>
              <User className="w-7 h-7" style={{ color: tc.textMut }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: tc.text }}>Nenhum lead aqui</p>
            <p className="text-[13px] mt-1 mb-4" style={{ color: tc.textSec }}>Adicione leads para acompanhar</p>
            <Link to="/leads/new" className="btn btn-primary !rounded-[12px] !text-[13px] inline-flex">
              <Plus className="w-4 h-4" /> Adicionar Lead
            </Link>
          </div>
        ) : (
          activeItems.map(lead => {
            const idx = order.indexOf(lead.status);
            return (
              <MobileLeadCard
                key={lead.id}
                lead={lead}
                sc={sc}
                tc={tc}
                darkMode={darkMode}
                canBack={idx > 0}
                canForward={idx < 4}
                onBack={() => moveLead(lead.id, order[idx - 1])}
                onForward={() => moveLead(lead.id, order[idx + 1])}
              />
            );
          })
        )}
      </div>

      {/* DESKTOP: Full Kanban */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="flex gap-4 px-5 py-5 overflow-x-auto flex-1">
          {LEAD_STATUSES.map(col => {
            const items = leads.filter(l => l.status === col.id);
            const csc = STATUS_COLORS[col.id];
            const total = items.reduce((s, l) => s + l.value, 0);
            return (
              <div key={col.id} className="w-[260px] shrink-0 flex flex-col">
                {/* Column Header */}
                <div
                  className="rounded-[16px] p-4 mb-3"
                  style={{
                    background: darkMode
                      ? csc.light + '12'
                      : csc.light + '0D',
                    border: `1px solid ${csc.light}20`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: csc.light }} />
                      <h3 className="text-[12px] font-bold uppercase tracking-[0.05em]" style={{ color: csc.light }}>
                        {col.label}
                      </h3>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular"
                      style={{ background: csc.light + '20', color: csc.light }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold mt-1.5 tabular" style={{ color: tc.text }}>
                    {fmt(total)}
                  </p>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto pb-4 pr-1">
                  {items.map(lead => {
                    const idx = order.indexOf(lead.status);
                    return (
                      <div
                        key={lead.id}
                        className="rounded-[18px] p-4 transition-all hover:-translate-y-0.5"
                        style={{
                          background: tc.cardBg,
                          boxShadow: tc.cardShadow,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                              style={{ background: csc.light }}
                            >
                              {lead.name.charAt(0)}
                            </div>
                            <h4 className="text-[13px] font-semibold leading-tight" style={{ color: tc.text }}>
                              {lead.name}
                            </h4>
                          </div>
                          <p className="text-[12px] font-bold tabular shrink-0" style={{ color: tc.text }}>
                            {fmt(lead.value)}
                          </p>
                        </div>

                        <p className="text-[11px] mb-2" style={{ color: tc.textSec }}>
                          {lead.source} · {lead.phone}
                        </p>

                        {lead.notes && (
                          <p className="text-[11px] italic leading-relaxed mb-3 line-clamp-2" style={{ color: tc.textMut }}>
                            {lead.notes}
                          </p>
                        )}

                        <div
                          className="flex items-center justify-between pt-3"
                          style={{ borderTop: `1px solid ${tc.border}` }}
                        >
                          <div className="flex gap-1.5">
                            <a
                              href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="p-2 rounded-[8px] transition-colors"
                              style={{ background: '#30D15812', color: '#30D158' }}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-2 rounded-[8px] transition-colors"
                              style={{ background: '#0A84FF12', color: '#0A84FF' }}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <div className="flex gap-1">
                            {idx > 0 && (
                              <button
                                onClick={() => moveLead(lead.id, order[idx - 1])}
                                className="p-2 rounded-[8px] transition-colors"
                                style={{ background: tc.surfaceBg, color: tc.textSec }}
                                title="Voltar etapa"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < 4 && (
                              <button
                                onClick={() => moveLead(lead.id, order[idx + 1])}
                                className="p-2 rounded-[8px] transition-colors"
                                style={{ background: '#0A84FF12', color: '#0A84FF' }}
                                title="Avançar etapa"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div
                      className="rounded-[16px] border-2 border-dashed p-8 text-center"
                      style={{ borderColor: tc.border }}
                    >
                      <p className="text-[12px]" style={{ color: tc.textMut }}>Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Progress Bar */}
      <div
        className="lg:hidden shrink-0 px-4 pb-4 pt-2"
        style={{ borderTop: `1px solid ${tc.border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: tc.textSec }}>
            Funil de Conversão
          </p>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-apple-green" />
            <p className="text-[11px] font-bold text-apple-green">
              {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'fechado').length / leads.length) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {LEAD_STATUSES.map(col => {
            const count = leads.filter(l => l.status === col.id).length;
            const pct = leads.length > 0 ? (count / leads.length) * 100 : 20;
            const csc = STATUS_COLORS[col.id];
            return (
              <div
                key={col.id}
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: csc.light, minWidth: count > 0 ? 8 : 0 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface MobileLeadCardProps {
  lead: { id: string; name: string; phone: string; source: string; value: number; notes: string; status: LeadStatus };
  sc: { light: string };
  tc: ReturnType<typeof getThemeColors>;
  darkMode: boolean;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

const MobileLeadCard: React.FC<MobileLeadCardProps> = ({ lead, sc, tc, canBack, canForward, onBack, onForward }) => {
  const fmt = (n: number) =>
    n >= 1000000 ? `R$${(n / 1000000).toFixed(1)}M` :
    n >= 1000 ? `R$${(n / 1000).toFixed(0)}k` :
    `R$${n}`;

  return (
    <div
      className="rounded-[20px] p-5 transition-all"
      style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}
    >
      {/* Top row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[18px] font-bold text-white shrink-0"
          style={{ background: sc.light }}
        >
          {lead.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-semibold truncate" style={{ color: tc.text }}>{lead.name}</h4>
          <p className="text-[12px] mt-0.5" style={{ color: tc.textSec }}>{lead.source} · {lead.phone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[17px] font-bold tabular" style={{ color: tc.text }}>{fmt(lead.value)}</p>
          <p className="text-[10px] font-medium" style={{ color: tc.textMut }}>Valor</p>
        </div>
      </div>

      {lead.notes && (
        <p
          className="text-[13px] italic leading-relaxed mb-4 px-1 line-clamp-2"
          style={{ color: tc.textSec }}
        >
          "{lead.notes}"
        </p>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-2 pt-3"
        style={{ borderTop: `1px solid ${tc.border}` }}
      >
        {/* Contact */}
        <a
          href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[13px] font-semibold transition-colors"
          style={{ background: '#30D15812', color: '#30D158' }}
        >
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </a>
        <a
          href={`tel:${lead.phone}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[13px] font-semibold transition-colors"
          style={{ background: '#0A84FF12', color: '#0A84FF' }}
        >
          <Phone className="w-4 h-4" /> Ligar
        </a>

        {/* Move stage */}
        <div className="flex gap-1">
          {canBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-[12px] transition-colors"
              style={{ background: tc.surfaceBg, color: tc.textSec }}
              title="Voltar etapa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canForward && (
            <button
              onClick={onForward}
              className="p-2.5 rounded-[12px] transition-colors"
              style={{ background: sc.light + '18', color: sc.light }}
              title="Avançar etapa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
