import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Moon, LogOut, Globe, Trash2, ChevronRight, Info, Smartphone, Lock, Eye, EyeOff, KeyRound, Monitor, Tablet, X, Check } from 'lucide-react';
import { getThemeColors } from '../utils/theme';
import { ConfirmDialog, ToastContainer, useToast } from '../components/Toast';

const SettingsPage: React.FC = () => {
  const { logout, updateUser, user, darkMode, setDarkMode } = useGlobal();
  const nav = useNavigate();
  const tc = getThemeColors(darkMode);
  const toast = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notif, setNotif] = useState(true);
  const [showSite, setShowSite] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [siteTitle, setSiteTitle] = useState(user?.websiteTitle || '');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);

  const handleSavePassword = () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) { alert('As senhas não conferem'); return; }
    if (newPw.length < 6) { alert('A senha deve ter pelo menos 6 caracteres'); return; }
    setPwSaved(true);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSaved(false), 3000);
  };

  const devices = [
    { id: '1', name: 'iPhone 15 Pro', type: 'mobile' as const, browser: 'Safari', location: 'São Paulo, SP', lastActive: 'Agora (este dispositivo)', current: true },
    { id: '2', name: 'MacBook Pro', type: 'desktop' as const, browser: 'Chrome', location: 'São Paulo, SP', lastActive: 'Há 2 horas', current: false },
    { id: '3', name: 'iPad Air', type: 'tablet' as const, browser: 'Safari', location: 'São Paulo, SP', lastActive: 'Há 3 dias', current: false },
  ];
  const [activeDevices, setActiveDevices] = useState(devices);

  const removeDevice = (id: string) => { setActiveDevices(prev => prev.filter(d => d.id !== id)); };

  const DeviceIcon = ({ type }: { type: 'mobile' | 'desktop' | 'tablet' }) => {
    if (type === 'desktop') return <Monitor className="w-5 h-5" />;
    if (type === 'tablet') return <Tablet className="w-5 h-5" />;
    return <Smartphone className="w-5 h-5" />;
  };

  const ToggleRow = ({ icon, bg, label, desc, value, onChange }: { icon: React.ReactNode; bg: string; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="px-5 py-4 flex items-center gap-3.5">
      <div className={`p-2.5 ${bg} rounded-[10px]`}>{icon}</div>
      <div className="flex-1">
        <p className="text-[14px] font-medium" style={{ color: tc.text }}>{label}</p>
        <p className="text-[11px]" style={{ color: tc.textSec }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className={`toggle ${value ? 'toggle-on' : 'toggle-off'}`} />
    </div>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2 animate-slide-up">
      <p className="section-title">{title}</p>
      <div className="rounded-[20px] overflow-hidden" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>{children}</div>
    </div>
  );

  return (
    <div className="page space-y-6 pb-28 lg:max-w-2xl">
      <h2 className="text-[28px] font-bold tracking-tight animate-fade" style={{ color: tc.text }}>Configurações</h2>

      {/* Geral */}
      <SectionCard title="Geral">
        <ToggleRow
          icon={<Bell className="w-5 h-5 text-apple-red" />}
          bg="bg-apple-red/[0.06]"
          label="Notificações"
          desc="Lembretes de follow-up"
          value={notif}
          onChange={setNotif}
        />
        <div style={{ borderTop: `1px solid ${tc.border}` }} />
        <ToggleRow
          icon={<Moon className="w-5 h-5 text-apple-indigo" />}
          bg="bg-apple-indigo/[0.06]"
          label="Modo Escuro"
          desc={darkMode ? "Ativado" : "Desativado"}
          value={darkMode}
          onChange={setDarkMode}
        />
      </SectionCard>

      {/* Meu Site */}
      <SectionCard title="Meu Site">
        <button onClick={() => setShowSite(!showSite)} className="w-full px-5 py-4 flex items-center gap-3.5 transition-colors">
          <div className="p-2.5 bg-apple-green/[0.06] rounded-[10px]"><Globe className="w-5 h-5 text-apple-green" /></div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-medium" style={{ color: tc.text }}>Site Público</p>
            <p className="text-[11px]" style={{ color: tc.textSec }}>Título e aparência</p>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${showSite ? 'rotate-90' : ''}`} style={{ color: tc.textFaint }} />
        </button>
        {showSite && (
          <div className="px-5 pb-4 space-y-3 animate-scale">
            <label className="section-title !text-[10px]">Título do Site</label>
            <input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} className="input" placeholder="Encontre seu Lar Ideal" />
            <button onClick={() => { updateUser({ websiteTitle: siteTitle }); setShowSite(false); }} className="btn btn-primary w-full !rounded-[12px] !text-[14px]">Salvar</button>
          </div>
        )}
      </SectionCard>

      {/* Segurança */}
      <SectionCard title="Segurança">
        <button onClick={() => setShowPrivacy(!showPrivacy)} className="w-full px-5 py-4 flex items-center gap-3.5 transition-colors">
          <div className="p-2.5 bg-apple-green/[0.06] rounded-[10px]"><Shield className="w-5 h-5 text-apple-green" /></div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-medium" style={{ color: tc.text }}>Privacidade</p>
            <p className="text-[11px]" style={{ color: tc.textSec }}>Senha, 2FA e visibilidade</p>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${showPrivacy ? 'rotate-90' : ''}`} style={{ color: tc.textFaint }} />
        </button>
        {showPrivacy && (
          <div className="px-5 pb-5 space-y-5 animate-scale pt-4" style={{ borderTop: `1px solid ${tc.border}` }}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-apple-blue" />
                <p className="text-[13px] font-semibold" style={{ color: tc.text }}>Alterar Senha</p>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Senha atual" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="input !pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: tc.textSec }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input type={showPassword ? 'text' : 'password'} placeholder="Nova senha (mín. 6 caracteres)" value={newPw} onChange={e => setNewPw(e.target.value)} className="input" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Confirmar nova senha" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="input" />
              {newPw && confirmPw && newPw !== confirmPw && <p className="text-[12px] text-apple-red font-medium">As senhas não conferem</p>}
              {pwSaved ? (
                <div className="flex items-center gap-2 text-apple-green text-[13px] font-semibold py-2"><Check className="w-4 h-4" /> Senha alterada com sucesso!</div>
              ) : (
                <button onClick={handleSavePassword} disabled={!currentPw || !newPw || !confirmPw || newPw !== confirmPw}
                  className="btn btn-primary w-full !rounded-[12px] !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                  <Lock className="w-4 h-4" /> Alterar Senha
                </button>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${tc.border}` }} />
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-apple-purple/[0.06] rounded-[10px]"><Shield className="w-5 h-5 text-apple-purple" /></div>
              <div className="flex-1">
                <p className="text-[14px] font-medium" style={{ color: tc.text }}>Autenticação 2FA</p>
                <p className="text-[11px]" style={{ color: tc.textSec }}>Camada extra de segurança</p>
              </div>
              <button onClick={() => setTwoFactor(!twoFactor)} className={`toggle ${twoFactor ? 'toggle-on' : 'toggle-off'}`} />
            </div>
            {twoFactor && (
              <div className="bg-apple-green/[0.06] rounded-[12px] p-3.5 flex items-center gap-2.5 animate-scale">
                <Check className="w-4 h-4 text-apple-green shrink-0" />
                <p className="text-[12px] text-apple-green font-medium">Autenticação de dois fatores ativada</p>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${tc.border}` }} />
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-apple-blue/[0.06] rounded-[10px]">
                {profileVisible ? <Eye className="w-5 h-5 text-apple-blue" /> : <EyeOff className="w-5 h-5 text-apple-blue" />}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium" style={{ color: tc.text }}>Perfil Público</p>
                <p className="text-[11px]" style={{ color: tc.textSec }}>Visível no site para clientes</p>
              </div>
              <button onClick={() => setProfileVisible(!profileVisible)} className={`toggle ${profileVisible ? 'toggle-on' : 'toggle-off'}`} />
            </div>
          </div>
        )}
        <div style={{ borderTop: `1px solid ${tc.border}` }} />
        <button onClick={() => setShowDevices(!showDevices)} className="w-full px-5 py-4 flex items-center gap-3.5 transition-colors">
          <div className="p-2.5 bg-apple-blue/[0.06] rounded-[10px]"><Smartphone className="w-5 h-5 text-apple-blue" /></div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-medium" style={{ color: tc.text }}>Dispositivos</p>
            <p className="text-[11px]" style={{ color: tc.textSec }}>{activeDevices.length} sessões ativas</p>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${showDevices ? 'rotate-90' : ''}`} style={{ color: tc.textFaint }} />
        </button>
        {showDevices && (
          <div className="px-5 pb-5 space-y-3 animate-scale pt-4" style={{ borderTop: `1px solid ${tc.border}` }}>
            {activeDevices.map(device => (
              <div key={device.id} className="flex items-center gap-3.5 p-3.5 rounded-[14px]" style={{ background: tc.surfaceBg }}>
                <div className={`p-2.5 rounded-[10px] ${device.current ? 'bg-apple-green/[0.1] text-apple-green' : ''}`}
                  style={device.current ? {} : { background: darkMode ? '#3A3A3C' : '#E5E5EA', color: tc.textMut }}>
                  <DeviceIcon type={device.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold truncate" style={{ color: tc.text }}>{device.name}</p>
                    {device.current && (
                      <span className="px-2 py-0.5 bg-apple-green/10 text-apple-green text-[9px] font-bold rounded-full uppercase">Atual</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: tc.textSec }}>{device.browser} • {device.location}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: tc.textSec }}>{device.lastActive}</p>
                </div>
                {!device.current && (
                  <button onClick={() => removeDevice(device.id)} className="p-2 hover:bg-apple-red/[0.06] rounded-[8px] transition-colors" style={{ color: tc.textSec }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {activeDevices.length > 1 && (
              <button onClick={() => setActiveDevices(prev => prev.filter(d => d.current))}
                className="w-full py-3 text-apple-red text-[13px] font-semibold bg-apple-red/[0.04] hover:bg-apple-red/[0.08] rounded-[12px] transition-colors">
                Encerrar todas as outras sessões
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* Zona de Perigo */}
      <SectionCard title="Zona de Perigo">
        <button onClick={() => setShowClearConfirm(true)}
          className="w-full px-5 py-4 flex items-center gap-3.5 hover:bg-apple-red/[0.04] transition-colors">
          <div className="p-2.5 bg-apple-red/[0.06] rounded-[10px]"><Trash2 className="w-5 h-5 text-apple-red" /></div>
          <div className="flex-1 text-left"><p className="text-[14px] font-medium text-apple-red">Limpar Dados</p><p className="text-[11px]" style={{ color: tc.textSec }}>Voltar ao estado inicial</p></div>
        </button>
        <div style={{ borderTop: `1px solid ${tc.border}` }} />
        <button onClick={() => { logout(); nav('/login'); }}
          className="w-full px-5 py-4 flex items-center gap-3.5 hover:bg-apple-red/[0.04] transition-colors">
          <div className="p-2.5 bg-apple-red/[0.06] rounded-[10px]"><LogOut className="w-5 h-5 text-apple-red" /></div>
          <div className="flex-1 text-left"><p className="text-[14px] font-medium text-apple-red">Sair da Conta</p><p className="text-[11px]" style={{ color: tc.textSec }}>Encerrar sessão</p></div>
        </button>
      </SectionCard>

      <div className="rounded-[20px] px-5 py-4 flex items-center gap-3.5 animate-slide-up delay-4" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        <div className="p-2.5 rounded-[10px]" style={{ background: tc.surfaceBg }}><Info className="w-5 h-5" style={{ color: tc.textSec }} /></div>
        <div><p className="text-[14px] font-medium" style={{ color: tc.text }}>ImobiPro</p><p className="text-[11px]" style={{ color: tc.textSec }}>Versão 3.0 Premium</p></div>
      </div>

      {/* Confirm clear data */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Apagar todos os dados?"
        message="Isso vai remover todos os seus leads, imóveis, contratos e configurações. Não tem como desfazer."
        confirmLabel="Sim, apagar tudo"
        cancelLabel="Cancelar"
        danger
        darkMode={darkMode}
        onConfirm={() => { localStorage.clear(); logout(); nav('/login'); }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </div>
  );
};

export default SettingsPage;
