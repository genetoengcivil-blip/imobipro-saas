import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { User, Plus, ChevronLeft, ChevronRight, X, Check, Trash2 } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, format } from 'date-fns';
import { getThemeColors } from '../utils/theme';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const TYPES: Record<string, { bg: string; text: string; dot: string }> = {
  visita: { bg: 'bg-apple-blue/[0.06]', text: 'text-apple-blue', dot: 'bg-apple-blue' },
  'reunião': { bg: 'bg-apple-indigo/[0.06]', text: 'text-apple-indigo', dot: 'bg-apple-indigo' },
  'follow-up': { bg: 'bg-apple-orange/[0.06]', text: 'text-apple-orange', dot: 'bg-apple-orange' },
  assinatura: { bg: 'bg-apple-green/[0.06]', text: 'text-apple-green', dot: 'bg-apple-green' },
};
const TYPE_EMOJIS: Record<string, string> = { visita: '🏠', 'reunião': '💼', 'follow-up': '📞', assinatura: '✍️' };

const CalendarPage: React.FC = () => {
  const { appointments, addAppointment, toggleAppointment, deleteAppointment, darkMode } = useGlobal();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', time: '10:00', leadName: '', type: 'visita' as 'visita' | 'reunião' | 'follow-up' | 'assinatura', notes: '' });
  const tc = getThemeColors(darkMode);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const offset = getDay(startOfMonth(month));
  const today = new Date();
  const selStr = format(selected, 'yyyy-MM-dd');
  const dayAppts = appointments.filter(a => a.date === selStr).sort((a, b) => a.time.localeCompare(b.time));
  const pendingCount = appointments.filter(a => !a.completed).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addAppointment({ title: form.title, date: selStr, time: form.time, leadName: form.leadName, type: form.type, notes: form.notes, completed: false });
    setShowForm(false);
    setForm({ title: '', time: '10:00', leadName: '', type: 'visita', notes: '' });
  };

  return (
    <div className="page space-y-6 lg:max-w-3xl">
      <div className="flex justify-between items-start animate-fade">
        <div>
          <h2 className="text-[30px] font-bold tracking-tight" style={{ color: tc.text }}>Agenda</h2>
          <p className="text-[13px] mt-0.5" style={{ color: tc.textSec }}>{pendingCount} pendentes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary !p-3 !rounded-[14px]">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Card */}
      <div className="rounded-[20px] p-6 animate-slide-up delay-1" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[18px] font-bold tracking-tight" style={{ color: tc.text }}>
            {MONTHS[month.getMonth()]} <span style={{ color: tc.textSec }} className="font-medium">{month.getFullYear()}</span>
          </h3>
          <div className="flex gap-1">
            <button onClick={() => setMonth(subMonths(month, 1))} className="p-2.5 rounded-[10px] transition-colors" style={{ color: tc.textSec }}><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => { setMonth(new Date()); setSelected(new Date()); }} className="px-3 py-1.5 text-[12px] font-semibold text-apple-blue hover:bg-apple-blue/[0.06] rounded-[8px] transition-colors">Hoje</button>
            <button onClick={() => setMonth(addMonths(month, 1))} className="p-2.5 rounded-[10px] transition-colors" style={{ color: tc.textSec }}><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {DAYS.map((d, i) => <div key={i} className="text-center text-[11px] font-semibold py-2" style={{ color: tc.textSec }}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const ds = format(day, 'yyyy-MM-dd');
            const dayEvents = appointments.filter(a => a.date === ds);
            const has = dayEvents.length > 0;
            const isT = isSameDay(day, today);
            const isS = isSameDay(day, selected);
            return (
              <button key={ds} onClick={() => setSelected(day)}
                className="aspect-square flex flex-col items-center justify-center rounded-[12px] text-[14px] font-medium transition-all relative"
                style={
                  isS ? { background: '#0A84FF', color: '#fff', boxShadow: '0 2px 12px rgba(10,132,255,0.3)' }
                  : isT ? { background: 'rgba(10,132,255,0.06)', color: '#0A84FF', fontWeight: 700 }
                  : { color: tc.text }
                }>
                {format(day, 'd')}
                {has && (
                  <div className="flex gap-[2px] mt-[2px]">
                    {dayEvents.slice(0, 3).map((evt, ei) => (
                      <div key={ei} className={`w-[4px] h-[4px] rounded-full ${isS ? 'bg-white' : (TYPES[evt.type]?.dot || 'bg-apple-blue')}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Events */}
      <div className="space-y-3 animate-slide-up delay-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold" style={{ color: tc.text }}>
            {isSameDay(selected, today) ? 'Hoje' : format(selected, "dd 'de' MMMM")}
          </p>
          <span className="text-[12px] font-medium" style={{ color: tc.textSec }}>{dayAppts.length} evento{dayAppts.length !== 1 ? 's' : ''}</span>
        </div>

        {dayAppts.length > 0 ? (
          <div className="space-y-3">
            {dayAppts.map(evt => {
              const ts = TYPES[evt.type] || TYPES.visita;
              const emoji = TYPE_EMOJIS[evt.type] || '📅';
              return (
                <div key={evt.id} className={`rounded-[20px] overflow-hidden ${evt.completed ? 'opacity-50' : ''}`} style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
                  <div className={`h-1 ${ts.dot}`} />
                  <div className="p-5 flex gap-4">
                    <div className="flex flex-col items-center min-w-[52px]">
                      <span className="text-[20px]">{emoji}</span>
                      <span className="text-[15px] font-bold tabular mt-1" style={{ color: tc.text }}>{evt.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[15px] font-semibold leading-tight ${evt.completed ? 'line-through' : ''}`} style={{ color: tc.text }}>{evt.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge ${ts.bg} ${ts.text}`}>{evt.type}</span>
                        {evt.leadName && <span className="text-[11px] flex items-center gap-1" style={{ color: tc.textSec }}><User className="w-3 h-3" />{evt.leadName}</span>}
                      </div>
                      {evt.notes && <p className="text-[12px] mt-2 italic leading-relaxed" style={{ color: tc.textSec }}>{evt.notes}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => toggleAppointment(evt.id)}
                        className={`p-2.5 rounded-[10px] transition-all ${evt.completed ? 'bg-apple-green/10 text-apple-green' : 'text-apple-green hover:bg-apple-green/[0.06]'}`}
                        style={evt.completed ? {} : { background: tc.surfaceBg, color: tc.textSec }}>
                        <Check className="w-4 h-4" style={evt.completed ? { color: '#30D158' } : {}} />
                      </button>
                      <button onClick={() => deleteAppointment(evt.id)} className="p-2.5 rounded-[10px] hover:bg-apple-red/[0.06] transition-all" style={{ background: tc.surfaceBg, color: tc.textSec }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state rounded-[20px] py-16" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <span className="text-[32px] mb-3">📅</span>
            <p className="text-[15px] font-medium" style={{ color: tc.textMut }}>Sem compromissos</p>
            <p className="text-[13px] mt-1" style={{ color: tc.textSec }}>Nenhum evento agendado para este dia</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary !rounded-full !py-2.5 !px-6 !text-[13px] mt-5">
              <Plus className="w-4 h-4" /> Agendar
            </button>
          </div>
        )}
      </div>

      {/* Form Sheet */}
      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="sheet px-6 pt-2 pb-8">
            <div className="sheet-handle" />
            <form onSubmit={handleAdd} className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-[20px] font-bold tracking-tight" style={{ color: tc.text }}>Novo Compromisso</p>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-[10px] transition-colors" style={{ color: tc.textSec }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[13px] -mt-2" style={{ color: tc.textSec }}>{format(selected, 'dd/MM/yyyy')}</p>
              <input required placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input" />
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'visita' | 'reunião' | 'follow-up' | 'assinatura' })} className="input appearance-none">
                  {Object.entries(TYPE_EMOJIS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
                </select>
              </div>
              <input placeholder="Nome do cliente" value={form.leadName} onChange={e => setForm({ ...form, leadName: e.target.value })} className="input" />
              <textarea rows={2} placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input resize-none" />
              <button type="submit" className="btn btn-primary w-full !py-4 !rounded-[14px]">Agendar</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarPage;
