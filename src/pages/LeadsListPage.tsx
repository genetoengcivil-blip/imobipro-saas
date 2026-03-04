import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Plus, Search, Phone, MessageSquare, Trash2, Users, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LeadStatus, LEAD_STATUSES, STATUS_COLORS } from '../types';
import { getThemeColors } from '../utils/theme';
import { ConfirmDialog, ToastContainer, useToast } from '../components/Toast';

const GRADIENTS = ['gradient-blue', 'gradient-purple', 'gradient-orange', 'gradient-pink', 'gradient-green'];

const LeadsListPage: React.FC = () => {
  const { leads, deleteLead, moveLead, darkMode } = useGlobal();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LeadStatus | 'todos'>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const toast = useToast();
  const tc = getThemeColors(darkMode);

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    deleteLead(confirmDeleteId);
    setConfirmDeleteId(null);
    toast.success('Lead excluído com sucesso');
  };

  const filtered = leads
    .filter(l => filter === 'todos' || l.status === filter)
    .filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page space-y-5 lg:max-w-3xl">
      {/* Header */}
      <div className="flex justify-between items-start animate-fade">
        <div>
          <h2 className="text-[30px] font-bold tracking-tight" style={{ color: tc.text }}>Leads</h2>
          <p className="text-[13px] mt-0.5" style={{ color: tc.textSec }}>{leads.length} contatos · {leads.filter(l => l.status === 'fechado').length} fechados</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pipeline" className="btn btn-soft !text-[13px] !py-2.5 !px-4 !rounded-[12px]">Pipeline</Link>
          <Link to="/leads/new" className="btn btn-primary !p-3 !rounded-[14px]"><Plus className="w-[18px] h-[18px]" /></Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-slide-up delay-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: tc.textSec }} />
        <input type="text" placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="input !pl-12 !pr-4 !rounded-[16px]" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap animate-slide-up delay-2">
        <button onClick={() => setFilter('todos')}
          className="text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
          style={filter === 'todos' ? { background: tc.text, color: darkMode ? '#000' : '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } : { background: tc.cardBg, color: tc.textMut, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          Todos {leads.length}
        </button>
        {LEAD_STATUSES.map(s => {
          const count = leads.filter(l => l.status === s.id).length;
          return (
            <button key={s.id} onClick={() => setFilter(s.id)}
              className="text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
              style={filter === s.id ? { backgroundColor: STATUS_COLORS[s.id].light, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } : { background: tc.cardBg, color: tc.textMut, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {s.emoji} {count}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-[12px] font-medium animate-fade delay-3" style={{ color: tc.textSec }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>

      {/* Leads */}
      <div className="space-y-3">
        {filtered.map((lead, i) => {
          const sc = STATUS_COLORS[lead.status];
          const isOverdue = lead.nextFollowUp && lead.nextFollowUp <= today && lead.status !== 'fechado';
          const isExpanded = expandedId === lead.id;
          const grad = GRADIENTS[lead.name.charCodeAt(0) % GRADIENTS.length];

          return (
            <div key={lead.id} className={`rounded-[20px] overflow-hidden group animate-slide-up delay-${Math.min(i + 3, 10)}`}
              style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
              {/* Main row */}
              <button onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                className="w-full p-5 flex items-start gap-4 text-left transition-colors">
                <div className={`avatar avatar-md ${grad} mt-0.5`}>
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-semibold" style={{ color: tc.text }}>{lead.name}</h3>
                    {isOverdue && (
                      <span className="badge bg-apple-red/[0.06] text-apple-red">
                        <Clock className="w-3 h-3" /> Atrasado
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: tc.textSec }}>{lead.phone} · {lead.source}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className={`badge ${sc.bg} ${sc.text}`}>
                      <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: sc.light }} />
                      {LEAD_STATUSES.find(s => s.id === lead.status)?.label}
                    </span>
                    <p className="text-[16px] font-bold tabular" style={{ color: tc.text }}>R$ {lead.value.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 mt-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} style={{ color: tc.textFaint }} />
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 animate-scale" style={{ borderTop: `1px solid ${tc.border}` }}>
                  {lead.notes && (
                    <p className="text-[13px] italic leading-relaxed pt-4" style={{ color: tc.textMut }}>&ldquo;{lead.notes}&rdquo;</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[12px] p-3" style={{ background: tc.surfaceBg }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: tc.textSec }}>Comissão</p>
                      <p className="text-[15px] font-bold text-apple-green tabular mt-0.5">R$ {lead.commission.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="rounded-[12px] p-3" style={{ background: tc.surfaceBg }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: tc.textSec }}>Follow-up</p>
                      <p className="text-[15px] font-bold tabular mt-0.5" style={{ color: tc.text }}>
                        {lead.nextFollowUp ? new Date(lead.nextFollowUp + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Stage buttons */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {LEAD_STATUSES.map((s) => (
                      <button key={s.id} onClick={() => moveLead(lead.id, s.id)}
                        className="text-[11px] font-semibold px-3 py-2 rounded-[10px] whitespace-nowrap transition-all"
                        style={lead.status === s.id ? { backgroundColor: STATUS_COLORS[s.id].light, color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { background: tc.surfaceBg, color: tc.textMut }}>
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-apple-green/[0.06] text-apple-green rounded-[12px] font-semibold text-[13px] hover:bg-apple-green/[0.12] transition-all">
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </a>
                    <a href={`tel:${lead.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-apple-blue/[0.06] text-apple-blue rounded-[12px] font-semibold text-[13px] hover:bg-apple-blue/[0.12] transition-all">
                      <Phone className="w-4 h-4" /> Ligar
                    </a>
                    <button onClick={() => setConfirmDeleteId(lead.id)}
                      className="p-3 bg-apple-red/[0.06] text-apple-red rounded-[12px] hover:bg-apple-red/[0.12] transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state rounded-[20px] py-20" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: tc.surfaceBg }}>
              <Users className="w-7 h-7" style={{ color: tc.textFaint }} />
            </div>
            <p className="text-[16px] font-medium" style={{ color: tc.textMut }}>Nenhum lead encontrado</p>
            <p className="text-[13px] mt-1" style={{ color: tc.textSec }}>Tente ajustar seus filtros</p>
            <Link to="/leads/new" className="btn btn-primary !rounded-full !py-3 !px-6 !text-[13px] mt-5">
              <Plus className="w-4 h-4" /> Adicionar Lead
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Lead"
        message="Deseja realmente excluir este lead? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        darkMode={darkMode}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </div>
  );
};

export default LeadsListPage;
