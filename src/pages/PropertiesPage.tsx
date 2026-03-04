import React, { useState, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Plus, MapPin, Bed, Bath, Maximize2, Search, X, Trash2, Car, Star, Eye, Edit3, Camera, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import type { Property } from '../types';
import { getThemeColors } from '../utils/theme';
import { ConfirmDialog, ToastContainer, useToast } from '../components/Toast';

const PropertiesPage: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, darkMode } = useGlobal();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewImgIdx, setViewImgIdx] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const toast = useToast();
  const tc = getThemeColors(darkMode);

  const emptyForm = {
    title: '', description: '', price: '', type: 'venda' as 'venda' | 'locação',
    location: '', bedrooms: '2', bathrooms: '1', area: '', garage: '1',
    image: '', images: [] as string[], featured: false,
    status: 'disponível' as 'disponível' | 'vendido' | 'reservado'
  };
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = properties.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );
  const viewing = viewId ? properties.find(p => p.id === viewId) : null;

  const stats = [
    { label: 'Disponíveis', count: properties.filter(p => p.status === 'disponível').length, color: 'text-apple-green', dot: 'bg-apple-green' },
    { label: 'Reservados', count: properties.filter(p => p.status === 'reservado').length, color: 'text-apple-orange', dot: 'bg-apple-orange' },
    { label: 'Vendidos', count: properties.filter(p => p.status === 'vendido').length, color: 'text-apple-blue', dot: 'bg-apple-blue' },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm(prev => {
          const newImages = [...prev.images, base64];
          return { ...prev, images: newImages, image: prev.image || base64 };
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: newImages, image: newImages[0] || '' };
    });
  };

  const openAddForm = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEditForm = (prop: Property) => {
    setEditingId(prop.id);
    setForm({
      title: prop.title, description: prop.description, price: prop.price.toString(),
      type: prop.type, location: prop.location, bedrooms: prop.bedrooms.toString(),
      bathrooms: prop.bathrooms.toString(), area: prop.area.toString(),
      garage: prop.garage.toString(), image: prop.image,
      images: prop.images || [prop.image], featured: prop.featured, status: prop.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imgs = form.images.length > 0 ? form.images : (form.image ? [form.image] : []);
    const mainImg = imgs[0] || 'https://images.unsplash.com/photo-1460317442991-0ec209397148?auto=format&fit=crop&q=80&w=800';
    const data = {
      title: form.title, description: form.description, price: Number(form.price) || 0,
      type: form.type, location: form.location, bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms), area: Number(form.area), garage: Number(form.garage),
      image: mainImg, images: imgs.length > 0 ? imgs : [mainImg],
      featured: form.featured, status: form.status,
    };
    if (editingId) {
      updateProperty(editingId, data);
      toast.success('Imóvel atualizado!', 'As alterações foram salvas com sucesso.');
    } else {
      addProperty(data);
      toast.success('Imóvel cadastrado!', 'Agora ele aparece no seu site público também.');
    }
    setShowForm(false); setForm(emptyForm); setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (!confirmId) return;
    deleteProperty(confirmId);
    setConfirmId(null);
    setViewId(null);
    toast.success('Pronto!', 'O imóvel foi removido da sua carteira.');
  };

  const viewingImages = viewing ? (viewing.images && viewing.images.length > 0 ? viewing.images : [viewing.image]) : [];

  return (
    <div className="page space-y-5 lg:max-w-4xl">
      <div className="flex justify-between items-start animate-fade">
        <div>
          <h2 className="text-[30px] font-bold tracking-tight" style={{ color: tc.text }}>Imóveis</h2>
          <p className="text-[13px] mt-0.5" style={{ color: tc.textSec }}>{properties.length} cadastrados</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary !py-3 !px-5 !text-[14px] !rounded-[14px]">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up delay-1">
        {stats.map(s => (
          <div key={s.label} className="rounded-[20px] p-4 flex items-center gap-3" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <div className={`w-3 h-3 rounded-full ${s.dot}`} />
            <div>
              <p className={`text-[22px] font-bold ${s.color} tabular leading-none`}>{s.count}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] mt-1" style={{ color: tc.textSec }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative animate-slide-up delay-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: tc.textSec }} />
        <input type="text" placeholder="Buscar imóveis..." value={search} onChange={e => setSearch(e.target.value)} className="input !pl-12 !rounded-[16px]" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((prop, i) => (
          <div key={prop.id} className={`rounded-[20px] overflow-hidden group animate-slide-up delay-${Math.min(i + 3, 10)}`}
            style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
            <div className="relative h-52 overflow-hidden">
              <img src={prop.image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-3.5 left-3.5 flex gap-2">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${prop.type === 'venda' ? 'bg-white/90 text-ink' : 'bg-apple-green text-white'}`}>{prop.type}</span>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-md ${prop.status === 'disponível' ? 'bg-apple-green/20 text-apple-green' : prop.status === 'reservado' ? 'bg-apple-orange/20 text-apple-orange' : 'bg-apple-blue/20 text-apple-blue'}`}>{prop.status}</span>
              </div>
              {prop.featured && (
                <div className="absolute top-3.5 right-3.5 bg-apple-orange text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" /> Destaque
                </div>
              )}
              {prop.images && prop.images.length > 1 && (
                <div className="absolute bottom-14 right-3.5 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
                  <Camera className="w-3 h-3" /> {prop.images.length}
                </div>
              )}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex justify-between items-end">
                <p className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-[12px] text-[20px] font-bold text-ink tabular">R$ {prop.price.toLocaleString('pt-BR')}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => { setViewId(prop.id); setViewImgIdx(0); }}
                    className="p-2.5 bg-white/80 backdrop-blur rounded-[10px] text-ink-3 hover:text-ink transition-all">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEditForm(prop)}
                    className="p-2.5 bg-white/80 backdrop-blur rounded-[10px] text-ink-3 hover:text-apple-blue transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmId(prop.id)}
                    className="p-2.5 bg-white/80 backdrop-blur rounded-[10px] text-ink-4 hover:text-apple-red transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-[16px] font-bold leading-tight clamp-1" style={{ color: tc.text }}>{prop.title}</h3>
              <p className="text-[12px] flex items-center gap-1 mt-2" style={{ color: tc.textSec }}><MapPin className="w-3.5 h-3.5" /> {prop.location}</p>
              <div className="flex gap-5 mt-4 pt-4 text-[12px] font-medium" style={{ borderTop: `1px solid ${tc.border}`, color: tc.textMut }}>
                <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-apple-blue" />{prop.bedrooms}</span>
                <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-apple-blue" />{prop.bathrooms}</span>
                <span className="flex items-center gap-1.5"><Maximize2 className="w-4 h-4 text-apple-blue" />{prop.area}m²</span>
                <span className="flex items-center gap-1.5"><Car className="w-4 h-4 text-apple-blue" />{prop.garage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state rounded-[20px] py-20" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
          <span className="text-[40px] mb-3">🏠</span>
          <p className="text-[16px] font-semibold" style={{ color: tc.text }}>Nenhum imóvel aqui ainda</p>
          <p className="text-[13px] mt-1" style={{ color: tc.textSec }}>Clique em "Novo" para cadastrar seu primeiro imóvel</p>
        </div>
      )}

      {/* View Detail Sheet */}
      {viewing && (
        <>
          <div className="overlay" onClick={() => setViewId(null)} />
          <div className="sheet px-0 pt-0">
            <div className="relative h-72 overflow-hidden bg-black">
              <img src={viewingImages[viewImgIdx] || viewing.image} alt={viewing.title} className="w-full h-full object-cover transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <button onClick={() => setViewId(null)} className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur rounded-full z-10">
                <X className="w-5 h-5 text-ink" />
              </button>
              {viewingImages.length > 1 && (
                <>
                  <button onClick={() => setViewImgIdx(i => i > 0 ? i - 1 : viewingImages.length - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/70 backdrop-blur rounded-full z-10">
                    <ChevronLeft className="w-5 h-5 text-ink" />
                  </button>
                  <button onClick={() => setViewImgIdx(i => i < viewingImages.length - 1 ? i + 1 : 0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/70 backdrop-blur rounded-full z-10">
                    <ChevronRight className="w-5 h-5 text-ink" />
                  </button>
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {viewingImages.map((_, idx) => (
                      <button key={idx} onClick={() => setViewImgIdx(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === viewImgIdx ? 'bg-white w-6' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${viewing.type === 'venda' ? 'bg-white/90 text-ink' : 'bg-apple-green text-white'}`}>{viewing.type}</span>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-md ${viewing.status === 'disponível' ? 'bg-apple-green/20 text-apple-green' : viewing.status === 'reservado' ? 'bg-apple-orange/20 text-apple-orange' : 'bg-apple-blue/20 text-apple-blue'}`}>{viewing.status}</span>
              </div>
            </div>
            {viewingImages.length > 1 && (
              <div className="flex gap-2 px-6 -mt-8 relative z-10">
                {viewingImages.map((img, idx) => (
                  <button key={idx} onClick={() => setViewImgIdx(idx)}
                    className={`w-16 h-12 rounded-[10px] overflow-hidden border-2 transition-all shrink-0 ${idx === viewImgIdx ? 'border-apple-blue shadow-lg scale-105' : 'border-white/50 opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="px-6 pb-8 pt-4 relative">
              <h3 className="text-[24px] font-bold tracking-tight" style={{ color: tc.text }}>{viewing.title}</h3>
              <p className="text-[14px] flex items-center gap-1.5 mt-2" style={{ color: tc.textSec }}><MapPin className="w-4 h-4" /> {viewing.location}</p>
              <div className="flex items-baseline gap-2 mt-4">
                <p className="text-[36px] font-bold tabular" style={{ color: tc.text }}>R$ {viewing.price.toLocaleString('pt-BR')}</p>
                {viewing.type === 'locação' && <span className="text-[14px] font-medium" style={{ color: tc.textSec }}>/mês</span>}
              </div>
              <div className="mt-6 p-4 rounded-[16px]" style={{ background: tc.surfaceBg }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: tc.textSec }}>Descrição</p>
                <p className="text-[14px] leading-relaxed" style={{ color: tc.textMut }}>{viewing.description}</p>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-6">
                {[
                  { icon: Bed, val: viewing.bedrooms, label: 'Quartos' },
                  { icon: Bath, val: viewing.bathrooms, label: 'Banheiros' },
                  { icon: Maximize2, val: `${viewing.area}m²`, label: 'Área' },
                  { icon: Car, val: viewing.garage, label: 'Vagas' },
                ].map(item => (
                  <div key={item.label} className="rounded-[14px] p-3.5 text-center" style={{ background: tc.surfaceBg }}>
                    <item.icon className="w-5 h-5 text-apple-blue mx-auto mb-1.5" />
                    <p className="text-[16px] font-bold" style={{ color: tc.text }}>{item.val}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: tc.textSec }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setViewId(null); const p = properties.find(x => x.id === viewId); if (p) openEditForm(p); }}
                  className="btn btn-soft flex-1 !py-4 !rounded-[14px] !text-[14px]">
                  <Edit3 className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => setConfirmId(viewing.id)}
                  className="btn !py-4 !px-6 !rounded-[14px] !text-[14px] bg-apple-red/[0.06] text-apple-red hover:bg-apple-red/[0.12]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Form Sheet */}
      {showForm && (
        <>
          <div className="overlay" onClick={() => { setShowForm(false); setEditingId(null); }} />
          <div className="sheet px-6 pt-2 pb-8">
            <div className="sheet-handle" />
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <p className="text-[20px] font-bold tracking-tight" style={{ color: tc.text }}>
                {editingId ? 'Editar Imóvel' : 'Novo Imóvel'}
              </p>
              <div>
                <p className="text-[12px] font-semibold mb-2" style={{ color: tc.textMut }}>Fotos do Imóvel</p>
                <div className="flex gap-2 flex-wrap">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-[12px] overflow-hidden group/img">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <X className="w-5 h-5 text-white" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-apple-blue text-white text-[8px] font-bold text-center rounded-b-[10px] py-0.5">CAPA</span>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-apple-blue hover:text-apple-blue transition-colors"
                    style={{ borderColor: tc.textFaint, color: tc.textSec }}>
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[9px] font-semibold">Adicionar</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </div>
              <input required placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
              <input required placeholder="Localização" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Preço (R$)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" />
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'venda' | 'locação' })} className="input appearance-none">{['venda', 'locação'].map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Quartos', field: 'bedrooms' as const },
                  { label: 'Banhos', field: 'bathrooms' as const },
                  { label: 'm²', field: 'area' as const },
                  { label: 'Vagas', field: 'garage' as const },
                ].map(item => (
                  <div key={item.field}>
                    <label className="text-[10px] font-semibold block mb-1 pl-1" style={{ color: tc.textSec }}>{item.label}</label>
                    <input type="number" min="0" placeholder="0" value={form[item.field]} onChange={e => setForm({ ...form, [item.field]: e.target.value })} className="input text-center !px-1" />
                  </div>
                ))}
              </div>
              <textarea rows={3} placeholder="Descrição detalhada do imóvel..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input resize-none" />
              <div>
                <p className="text-[10px] font-semibold mb-1 pl-1" style={{ color: tc.textSec }}>Ou cole URL da imagem</p>
                <input placeholder="https://..." value={form.image} onChange={e => {
                  const url = e.target.value;
                  setForm(prev => ({ ...prev, image: url, images: url && !prev.images.includes(url) ? [...prev.images, url] : prev.images }));
                }} className="input" />
              </div>
              {editingId && (
                <div>
                  <p className="text-[10px] font-semibold mb-1 pl-1" style={{ color: tc.textSec }}>Status</p>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'disponível' | 'vendido' | 'reservado' })} className="input appearance-none">
                    <option value="disponível">Disponível</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                  </select>
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="w-[18px] h-[18px] rounded-md text-apple-blue focus:ring-apple-blue" style={{ borderColor: tc.textFaint }} />
                <span className="text-[14px] font-medium" style={{ color: tc.text }}>Destaque no site</span>
              </label>
              <button type="submit" className="btn btn-primary w-full !py-4 !rounded-[14px]">
                {editingId ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-ghost w-full !py-3 !rounded-[14px]" style={{ color: tc.textSec }}>
                  Cancelar
                </button>
              )}
            </form>
          </div>
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmId !== null}
        title="Remover este imóvel?"
        message="Ele vai sair da sua carteira e do site público. Essa ação não tem volta."
        confirmLabel="Sim, remover"
        cancelLabel="Cancelar"
        danger
        darkMode={darkMode}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmId(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </div>
  );
};

export default PropertiesPage;
