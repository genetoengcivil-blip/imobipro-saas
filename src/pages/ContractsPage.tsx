import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { FileText, Plus, X, Trash2, CheckCircle2, AlertCircle, FileEdit, ChevronDown } from 'lucide-react';
import type { Contract } from '../types';
import { ConfirmDialog, ToastContainer, useToast } from '../components/Toast';

type StatusFilter = 'todos' | Contract['status'];
type ContractType = Contract['type'];

const STATUS_CONFIG: Record<Contract['status'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  rascunho:  { label: 'Rascunho',  color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)',  icon: FileEdit },
  ativo:     { label: 'Ativo',     color: '#30D158', bg: 'rgba(48,209,88,0.1)',   icon: CheckCircle2 },
  concluido: { label: 'Concluído', color: '#0A84FF', bg: 'rgba(10,132,255,0.1)',  icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: '#FF453A', bg: 'rgba(255,69,58,0.1)',   icon: AlertCircle },
};

const TYPE_LABELS: Record<ContractType, string> = {
  compra_venda: 'Compra e Venda',
  locacao:      'Locação',
  permuta:      'Permuta',
  cessao:       'Cessão de Direitos',
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'todos',    label: 'Todos' },
  { id: 'rascunho', label: 'Rascunho' },
  { id: 'ativo',    label: 'Ativos' },
  { id: 'concluido',label: 'Concluídos' },
  { id: 'cancelado',label: 'Cancelados' },
];

const emptyForm = {
  title: '', client: '', property: '', value: '',
  commission: '', status: 'ativo' as Contract['status'],
  type: 'compra_venda' as ContractType,
  startDate: '', endDate: '', notes: '',
};

const ContractsPage: React.FC = () => {
  const { contracts, addContract, updateContract, deleteContract, properties, darkMode } = useGlobal();
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const toast = useToast();

  const bg = darkMode ? '#000' : '#F5F5F7';

  const handleDelete = () => {
    if (!confirmId) return;
    deleteContract(confirmId);
    setConfirmId(null);
    toast.success('Contrato excluído com sucesso');
  };
  const card = darkMode ? 'rgba(28,28,30,0.8)' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = darkMode ? '#fff' : '#1D1D1F';
  const textSecondary = darkMode ? '#8E8E93' : '#6E6E73';
  const inputBg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const filtered = contracts.filter(c => filter === 'todos' || c.status === filter);

  const totalValue = contracts.reduce((s, c) => s + c.value, 0);
  const totalCommission = contracts.reduce((s, c) => s + c.commission, 0);
  const activeCount = contracts.filter(c => c.status === 'ativo').length;

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: Contract) => {
    setForm({
      title: c.title, client: c.client, property: c.property,
      value: String(c.value), commission: String(c.commission),
      status: c.status, type: c.type,
      startDate: c.startDate, endDate: c.endDate, notes: c.notes,
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.client.trim()) return;
    const data: Omit<Contract, 'id' | 'createdAt'> = {
      title: form.title,
      client: form.client,
      property: form.property,
      value: parseFloat(form.value) || 0,
      commission: parseFloat(form.commission) || 0,
      status: form.status,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      notes: form.notes,
    };
    if (editingId) {
      updateContract(editingId, data);
    } else {
      addContract(data);
    }
    setShowForm(false);
  };

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen pb-32 lg:pb-10" style={{ background: bg }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: textPrimary }}>Contratos</h1>
            <p className="text-[14px] mt-0.5" style={{ color: textSecondary }}>{contracts.length} contrato{contracts.length !== 1 ? 's' : ''} cadastrado{contracts.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-apple-blue text-white px-5 py-3 rounded-[14px] font-semibold text-[14px] shadow-[0_4px_16px_rgba(10,132,255,0.3)] hover:bg-[#0A78E8] transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Contrato</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: contracts.length, suffix: '', color: '#0A84FF' },
            { label: 'Ativos', value: activeCount, suffix: '', color: '#30D158' },
            { label: 'Valor Total', value: `R$ ${(totalValue / 1000).toFixed(0)}k`, suffix: '', color: '#BF5AF2' },
            { label: 'Comissões', value: `R$ ${(totalCommission / 1000).toFixed(0)}k`, suffix: '', color: '#FF9F0A' },
          ].map(stat => (
            <div key={stat.label} className="rounded-[16px] p-4 text-center" style={{ background: card, border: `1px solid ${border}` }}>
              <p className="text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: textSecondary }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all"
              style={{
                background: filter === f.id ? textPrimary : (darkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                color: filter === f.id ? (darkMode ? '#000' : '#fff') : textSecondary,
                border: `1px solid ${border}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: textSecondary, opacity: 0.3 }} />
              <p className="text-[16px] font-medium" style={{ color: textSecondary }}>Nenhum contrato encontrado</p>
              <button onClick={openNew} className="mt-4 text-apple-blue text-[14px] font-semibold">Criar primeiro contrato</button>
            </div>
          )}
          {filtered.map(c => {
            const cfg = STATUS_CONFIG[c.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="rounded-[18px] overflow-hidden transition-all" style={{ background: card, border: `1px solid ${border}` }}>
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                      <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold truncate" style={{ color: textPrimary }}>{c.title}</h3>
                          <p className="text-[13px] mt-0.5" style={{ color: textSecondary }}>{c.client}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: textSecondary }}>Valor</p>
                          <p className="text-[15px] font-bold" style={{ color: textPrimary }}>R$ {c.value.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: textSecondary }}>Comissão</p>
                          <p className="text-[15px] font-bold text-apple-green">R$ {c.commission.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[11px] font-medium" style={{ color: textSecondary }}>Tipo</p>
                          <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>{TYPE_LABELS[c.type]}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all"
                        style={{ background: 'rgba(10,132,255,0.08)', color: '#0A84FF' }}>
                        <FileEdit className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => setConfirmId(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all"
                        style={{ background: 'rgba(255,69,58,0.08)', color: '#FF453A' }}>
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all"
                      style={{ color: textSecondary }}>
                      Detalhes <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 animate-fade" style={{ borderTop: `1px solid ${border}` }}>
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      {c.property && (
                        <div className="rounded-[12px] p-3" style={{ background: inputBg }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>Imóvel</p>
                          <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>{c.property}</p>
                        </div>
                      )}
                      {c.startDate && (
                        <div className="rounded-[12px] p-3" style={{ background: inputBg }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>Início</p>
                          <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>{new Date(c.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {c.endDate && (
                        <div className="rounded-[12px] p-3" style={{ background: inputBg }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>Vencimento</p>
                          <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>{new Date(c.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      <div className="rounded-[12px] p-3" style={{ background: inputBg }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>Criado em</p>
                        <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    {c.notes && (
                      <div className="rounded-[12px] p-3" style={{ background: inputBg }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>Observações</p>
                        <p className="text-[13px] leading-relaxed" style={{ color: textPrimary }}>{c.notes}</p>
                      </div>
                    )}
                    {/* Status change */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: textSecondary }}>Alterar Status</p>
                      <div className="flex flex-wrap gap-2">
                        {(['rascunho', 'ativo', 'concluido', 'cancelado'] as Contract['status'][]).map(s => {
                          const scfg = STATUS_CONFIG[s];
                          return (
                            <button key={s} onClick={() => updateContract(c.id, { status: s })}
                              className="px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition-all"
                              style={{
                                background: c.status === s ? scfg.bg : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                                color: c.status === s ? scfg.color : textSecondary,
                                border: `1px solid ${c.status === s ? scfg.color + '40' : border}`,
                              }}>
                              {scfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm Deletion */}
      <ConfirmDialog
        open={!!confirmId}
        onCancel={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Excluir Contrato"
        message="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
        danger
        darkMode={darkMode}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* Modal Form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <div className="w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto animate-scale max-h-[90vh] overflow-y-auto"
              style={{ background: darkMode ? '#1C1C1E' : '#fff' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full" style={{ background: border }} />
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[20px] font-bold" style={{ color: textPrimary }}>
                    {editingId ? 'Editar Contrato' : 'Novo Contrato'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-full" style={{ background: inputBg }}>
                    <X className="w-5 h-5" style={{ color: textSecondary }} />
                  </button>
                </div>

                {/* Fields */}
                {[
                  { label: 'Título do Contrato *', key: 'title', placeholder: 'Ex: Compra e Venda – Apt Centro' },
                  { label: 'Cliente *', key: 'client', placeholder: 'Nome do cliente' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>{f.label}</label>
                    <input value={form[f.key as keyof typeof form]} onChange={e => set(f.key as keyof typeof form, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }} />
                  </div>
                ))}

                {/* Property selector */}
                <div>
                  <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Imóvel</label>
                  <select value={form.property} onChange={e => set('property', e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                    style={{ background: inputBg, color: textPrimary }}>
                    <option value="">Selecionar imóvel...</option>
                    {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                  </select>
                </div>

                {/* Type & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Tipo</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)}
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }}>
                      <option value="compra_venda">Compra e Venda</option>
                      <option value="locacao">Locação</option>
                      <option value="permuta">Permuta</option>
                      <option value="cessao">Cessão de Direitos</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)}
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }}>
                      <option value="rascunho">Rascunho</option>
                      <option value="ativo">Ativo</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* Value & Commission */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Valor (R$)</label>
                    <input type="number" value={form.value} onChange={e => set('value', e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Comissão (R$)</label>
                    <input type="number" value={form.commission} onChange={e => set('commission', e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }} />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Data de Início</label>
                    <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Data de Vencimento</label>
                    <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0"
                      style={{ background: inputBg, color: textPrimary }} />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[12px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: textSecondary }}>Observações</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={3} placeholder="Detalhes adicionais do contrato..."
                    className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none font-medium border-0 resize-none"
                    style={{ background: inputBg, color: textPrimary }} />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-3.5 rounded-[14px] text-[15px] font-semibold transition-all"
                    style={{ background: inputBg, color: textSecondary }}>
                    Cancelar
                  </button>
                  <button onClick={handleSave}
                    className="flex-1 py-3.5 rounded-[14px] text-[15px] font-semibold bg-apple-blue text-white transition-all hover:bg-[#0A78E8] active:scale-95 shadow-[0_4px_16px_rgba(10,132,255,0.3)]">
                    {editingId ? 'Salvar Alterações' : 'Criar Contrato'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractsPage;
