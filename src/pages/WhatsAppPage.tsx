import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { 
  MessageSquare, Search, Send, User as UserIcon, MoreVertical, 
  Phone, Plus, ArrowLeft, CheckCheck, 
  QrCode, ShieldCheck, Zap, Settings, HelpCircle, X,
  RefreshCcw, AlertCircle, LogOut
} from 'lucide-react';
import { STATUS_COLORS } from '../types';
import { Logo } from '../components/Logo';

const WhatsAppPage: React.FC = () => {
  const { leads, user, messages, addMessage, markAsRead, whatsappConnected, setWhatsappConnected } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    instanceName: user?.company?.toLowerCase().replace(/\s+/g, '_') || 'imobipro_inst',
    token: '••••••••••••••••',
    gatewayUrl: 'https://api.imobipro.com/v1'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const leadMessages = messages.filter(m => m.leadId === selectedLeadId);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [leadMessages]);

  // Mark as read when selecting lead
  useEffect(() => {
    if (selectedLeadId) markAsRead(selectedLeadId);
  }, [selectedLeadId, markAsRead, messages.length]);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setWhatsappConnected(true);
    }, 3000);
  };

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedLeadId) return;

    // 1. Add our message
    addMessage({
      leadId: selectedLeadId,
      text: inputText,
      sender: 'me'
    });

    setInputText('');
  }, [inputText, selectedLeadId, addMessage]);

  const toggleConfig = () => setShowConfig(!showConfig);

  if (!whatsappConnected) {
    return (
      <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-40px)] flex flex-col items-center justify-center p-6 bg-white dark:bg-[#111b21] rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-sm transition-all animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-apple-blue/10 dark:bg-apple-blue/20 rounded-[32px] flex items-center justify-center mx-auto mb-2 animate-pulse">
              <QrCode className="w-12 h-12 text-apple-blue" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full border-4 border-white dark:border-[#111b21] flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Conectar Central WhatsApp</h2>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Para gerenciar seus leads e enviar mensagens diretamente do ImobiPro, conecte sua instância de WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
              <Zap className="w-5 h-5 text-yellow-500 mb-2" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Instância</h4>
              <p className="text-[11px] text-zinc-500">Crie sua sessão única no gateway.</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
              <QrCode className="w-5 h-5 text-apple-blue mb-2" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">QR Code</h4>
              <p className="text-[11px] text-zinc-500">Escaneie com seu celular como Web.</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
              <ShieldCheck className="w-5 h-5 text-apple-green mb-2" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Pronto</h4>
              <p className="text-[11px] text-zinc-500">Comece a vender em segundos.</p>
            </div>
          </div>

          {isConnecting ? (
            <div className="p-10 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-4">
              <RefreshCcw className="w-12 h-12 text-apple-blue animate-spin" />
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Gerando QR Code...</p>
              <p className="text-xs text-zinc-500">Solicitando permissão ao servidor de API</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={handleConnect}
                className="w-full py-4 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-2xl font-bold shadow-lg shadow-apple-blue/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Gerar Novo QR Code
              </button>
              <button 
                onClick={toggleConfig}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                Configurações Avançadas de API
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              <AlertCircle className="w-3 h-3" /> API Ativa
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              <HelpCircle className="w-3 h-3" /> Suporte
            </div>
          </div>
        </div>

        {/* API Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Ajustes de Integração</h3>
                <button onClick={toggleConfig} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">URL do Gateway (API)</label>
                  <input 
                    type="text" 
                    value={config.gatewayUrl}
                    onChange={(e) => setConfig({...config, gatewayUrl: e.target.value})}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Nome da Instância</label>
                  <input 
                    type="text" 
                    value={config.instanceName}
                    onChange={(e) => setConfig({...config, instanceName: e.target.value})}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">API Key (Token)</label>
                  <input 
                    type="password" 
                    value={config.token}
                    onChange={(e) => setConfig({...config, token: e.target.value})}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={toggleConfig}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={toggleConfig}
                  className="flex-1 py-4 bg-apple-blue text-white rounded-2xl font-bold shadow-lg shadow-apple-blue/20"
                >
                  Salvar Dados
                </button>
              </div>
              <p className="mt-4 text-[10px] text-zinc-400 text-center leading-relaxed">
                Essas informações são fornecidas pelo seu painel de API.<br/>Nunca compartilhe seu Token com terceiros.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-40px)] flex bg-white dark:bg-[#111b21] border border-zinc-200 dark:border-white/10 rounded-[24px] overflow-hidden shadow-sm transition-all duration-300">
      
      {/* Sidebar - Chat List */}
      <div className={`w-full lg:w-[380px] border-r border-zinc-200 dark:border-white/10 flex flex-col bg-white dark:bg-[#111b21] ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center border border-apple-blue/20 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-apple-blue" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-zinc-900 dark:text-[#e9edef] leading-none">Mensagens</h2>
              <span className="text-[10px] font-bold text-apple-green mt-1 flex items-center gap-1 uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-apple-green rounded-full animate-pulse" /> Conectado
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleConfig} className="p-2 text-zinc-500 dark:text-[#aebac1] hover:bg-zinc-200 dark:hover:bg-[#2a3942] rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-zinc-500 dark:text-[#aebac1] hover:bg-zinc-200 dark:hover:bg-[#2a3942] rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-[#8696a0]" />
            <input 
              type="text"
              placeholder="Pesquisar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-xl text-sm text-zinc-900 dark:text-[#e9edef] focus:outline-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredLeads.map(lead => {
            const color = STATUS_COLORS[lead.status];
            const lastMsg = messages.filter(m => m.leadId === lead.id).slice(-1)[0];
            const unread = messages.filter(m => m.leadId === lead.id && !m.read && m.sender === 'lead').length;
            
            return (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLeadId(lead.id);
                  setShowMobileChat(true);
                }}
                className={`w-full flex items-center gap-3 p-4 border-b border-zinc-200/50 dark:border-[#202c33] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-all relative ${selectedLeadId === lead.id ? 'bg-[#ebebeb] dark:bg-[#2a3942]' : 'bg-white dark:bg-[#111b21]'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-[#202c33] flex items-center justify-center overflow-hidden">
                    <span className="text-lg font-bold text-zinc-500 dark:text-[#8696a0]">{lead.name.charAt(0)}</span>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#111b21] ${color.dot}`} />
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-zinc-900 dark:text-[#e9edef] truncate">{lead.name}</h3>
                    <span className="text-[10px] text-zinc-500 dark:text-[#8696a0] font-bold uppercase">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ontem'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate font-medium ${unread > 0 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-[#8696a0]'}`}>
                      {lastMsg ? lastMsg.text : `Sem mensagens.`}
                    </p>
                    {unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-apple-blue flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-bold text-white">{unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] relative ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/630/wallpaper-whatsapp-background.jpg")', backgroundSize: 'cover' }} />

        {selectedLead ? (
          <>
            {/* Header */}
            <div className="relative z-10 p-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-zinc-300 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobileChat(false)} className="lg:hidden p-2 text-zinc-600 dark:text-[#aebac1]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-[#202c33] flex items-center justify-center">
                  <span className="text-lg font-bold text-zinc-500 dark:text-[#8696a0]">{selectedLead.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-[#e9edef] leading-none">{selectedLead.name}</h3>
                  <p className="text-[11px] text-apple-green font-bold mt-1">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estágio</span>
                  <span className={`text-[11px] font-bold ${STATUS_COLORS[selectedLead.status].text}`}>{selectedLead.status.toUpperCase()}</span>
                </div>
                <button className="p-2 text-zinc-500 dark:text-[#aebac1] hover:bg-zinc-200 dark:hover:bg-[#2a3942] rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-zinc-500 dark:text-[#aebac1] hover:bg-zinc-200 dark:hover:bg-[#2a3942] rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {leadMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <MessageSquare className="w-12 h-12 mb-2" />
                  <p className="text-sm font-bold">Sem histórico. Inicie a conversa agora.</p>
                </div>
              ) : (
                leadMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm text-sm relative ${
                        msg.sender === 'me' 
                          ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-zinc-900 dark:text-[#e9edef] rounded-tr-none' 
                          : 'bg-white dark:bg-[#202c33] text-zinc-900 dark:text-[#e9edef] rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <div className="flex justify-end items-center gap-1 mt-1">
                        <span className="text-[9px] text-zinc-500 dark:text-[#8696a0] font-bold uppercase">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-apple-blue" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10 p-4 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-zinc-300 dark:border-white/10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" className="p-2 text-zinc-500 dark:text-[#aebac1]">
                  <Plus className="w-6 h-6" />
                </button>
                <input 
                  type="text"
                  placeholder="Mensagem"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-[#2a3942] border-none rounded-xl text-sm focus:outline-none"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-3 rounded-full transition-all ${inputText.trim() ? 'bg-apple-blue text-white shadow-lg' : 'bg-zinc-300 dark:bg-[#2a3942] text-zinc-500'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
            <div className="w-24 h-24 rounded-full bg-apple-blue/10 flex items-center justify-center mb-6">
              <Logo size={48} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-[#e9edef] mb-3">ImobiPro para Web</h2>
            <p className="text-zinc-600 dark:text-[#8696a0] max-w-sm leading-relaxed font-medium mb-8">
              Envie e receba mensagens dos seus leads sem tirar o celular do bolso. 
              Mantenha o histórico e converta mais rápido.
            </p>
            <div className="p-4 bg-white/50 dark:bg-[#202c33] rounded-2xl flex items-center gap-3 border border-white dark:border-white/5 backdrop-blur-sm shadow-sm">
              <ShieldCheck className="w-8 h-8 text-apple-green" />
              <p className="text-[11px] text-zinc-500 dark:text-[#8696a0] font-bold text-left uppercase tracking-wider">
                Criptografia de ponta a ponta ativa.<br/>Suas conversas estão protegidas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Re-using API Config Modal here too */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Ajustes da API</h3>
              <button onClick={toggleConfig} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">URL do Gateway</label>
                <input type="text" value={config.gatewayUrl} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-none text-sm" readOnly />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Instância Ativa</label>
                <div className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-between">
                  <span className="text-sm font-bold">{config.instanceName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-apple-green/20 text-apple-green text-[9px] font-bold uppercase tracking-widest">Ativo</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Token</label>
                <input type="password" value={config.token} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-none text-sm" readOnly />
              </div>
            </div>
            <div className="mt-8">
              <button 
                onClick={() => { setWhatsappConnected(false); setShowConfig(false); }}
                className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Desconectar Instância
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppPage;
