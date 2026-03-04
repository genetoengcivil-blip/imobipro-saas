import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { ArrowLeft, User, Phone, Mail, DollarSign, FileText, Calendar, Percent } from 'lucide-react';
import { LeadStatus } from '../types';
import { getThemeColors } from '../utils/theme';

const LeadFormPage: React.FC = () => {
  const nav = useNavigate();
  const { addLead, darkMode } = useGlobal();
  const tc = getThemeColors(darkMode);
  const [f, setF] = useState({ name: '', phone: '', email: '', value: '', commission: '', status: 'novo' as LeadStatus, source: 'WhatsApp', nextFollowUp: '', notes: '' });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLead({ name: f.name, phone: f.phone, email: f.email, value: Number(f.value) || 0, commission: Number(f.commission) || 0, status: f.status, source: f.source, nextFollowUp: f.nextFollowUp, notes: f.notes, lastContact: new Date().toISOString() });
    nav('/leads');
  };

  return (
    <div className="page space-y-5 animate-fade">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="p-2 rounded-[8px] transition-colors" style={{ color: tc.text }}><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-[22px] font-bold tracking-tight" style={{ color: tc.text }}>Novo Lead</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pb-8">
        <div className="rounded-[20px] p-5 space-y-4 animate-slide-up delay-1" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
          <p className="section-title !mb-0">Contato</p>
          <Field icon={<User className="w-[17px] h-[17px]" />} label="Nome Completo" required value={f.name} onChange={v => set('name', v)} placeholder="João Silva" tc={tc} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field icon={<Phone className="w-[17px] h-[17px]" />} label="WhatsApp" required type="tel" value={f.phone} onChange={v => set('phone', v)} placeholder="(11) 99999-9999" tc={tc} />
            <Field icon={<Mail className="w-[17px] h-[17px]" />} label="E-mail" type="email" value={f.email} onChange={v => set('email', v)} placeholder="joao@email.com" tc={tc} />
          </div>
        </div>

        <div className="rounded-[20px] p-5 space-y-4 animate-slide-up delay-2" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
          <p className="section-title !mb-0">Negócio</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field icon={<DollarSign className="w-[17px] h-[17px]" />} label="Valor (R$)" type="number" value={f.value} onChange={v => set('value', v)} placeholder="500000" tc={tc} />
            <Field icon={<Percent className="w-[17px] h-[17px]" />} label="Comissão (R$)" type="number" value={f.commission} onChange={v => set('commission', v)} placeholder="15000" tc={tc} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="section-title !text-[10px]">Estágio</label>
              <select value={f.status} onChange={e => set('status', e.target.value)} className="input appearance-none">
                <option value="novo">🔵 Novo Lead</option>
                <option value="contato">💬 Contato Feito</option>
                <option value="visita">🏠 Visita Agendada</option>
                <option value="proposta">📄 Proposta</option>
              </select>
            </div>
            <div>
              <label className="section-title !text-[10px]">Origem</label>
              <select value={f.source} onChange={e => set('source', e.target.value)} className="input appearance-none">
                {['WhatsApp', 'Site', 'Portal', 'Indicação', 'Instagram', 'Placa', 'Outro'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <Field icon={<Calendar className="w-[17px] h-[17px]" />} label="Próximo Follow-up" type="date" value={f.nextFollowUp} onChange={v => set('nextFollowUp', v)} tc={tc} />
        </div>

        <div className="rounded-[20px] p-5 space-y-4 animate-slide-up delay-3" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
          <p className="section-title !mb-0">Observações</p>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-[17px] h-[17px]" style={{ color: tc.textSec }} />
            <textarea rows={3} value={f.notes} onChange={e => set('notes', e.target.value)} className="input !pl-11 resize-none" placeholder="O que o cliente busca..." />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full !py-4 !text-[15px] !rounded-[14px] shadow-[0_4px_20px_rgba(10,132,255,0.3)] animate-slide-up delay-4">Salvar Lead</button>
      </form>
    </div>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; tc: ReturnType<typeof getThemeColors> }> = ({ icon, label, value, onChange, placeholder, type = 'text', required, tc }) => (
  <div>
    <label className="section-title !text-[10px]">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: tc.textSec }}>{icon}</div>
      <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} className="input !pl-11" placeholder={placeholder} />
    </div>
  </div>
);

export default LeadFormPage;
