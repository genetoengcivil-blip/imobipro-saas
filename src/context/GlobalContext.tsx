import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Lead, Property, Appointment, Transaction, User, LeadStatus, Contract, Message } from '../types';

const uid = () => Math.random().toString(36).substring(2, 11);

// Todos os dados fictícios foram removidos.
const SEED_LEADS: Lead[] = [];
const SEED_PROPERTIES: Property[] = [];

function load<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch { /* empty */ } return fallback;
}

interface Ctx {
  user: User | null; leads: Lead[]; properties: Property[];
  appointments: Appointment[]; transactions: Transaction[];
  contracts: Contract[];
  messages: Message[];
  whatsappConnected: boolean;
  setWhatsappConnected: (v: boolean) => void;
  addMessage: (m: Omit<Message, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (leadId: string) => void;
  darkMode: boolean; setDarkMode: (v: boolean) => void;
  login: (email: string, password: string) => void;
  logout: () => void; updateUser: (u: Partial<User>) => void;
  addLead: (l: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, u: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, s: LeadStatus) => void;
  addProperty: (p: Omit<Property, 'id'>) => void;
  updateProperty: (id: string, u: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addAppointment: (a: Omit<Appointment, 'id'>) => void;
  toggleAppointment: (id: string) => void;
  deleteAppointment: (id: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addContract: (c: Omit<Contract, 'id' | 'createdAt'>) => void;
  updateContract: (id: string, u: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
}

const GlobalContext = createContext<Ctx | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => load('imf_user', null));
  const [leads, setLeads] = useState<Lead[]>(() => load('imf_leads', SEED_LEADS));
  const [properties, setProperties] = useState<Property[]>(() => load('imf_props', SEED_PROPERTIES));
  const [appointments, setAppointments] = useState<Appointment[]>(() => load('imf_appts', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load('imf_txns', []));
  const [contracts, setContracts] = useState<Contract[]>(() => load('imf_contracts', []));
  const [messages, setMessages] = useState<Message[]>(() => load('imf_msgs', []));
  const [whatsappConnected, setWhatsappConnectedState] = useState<boolean>(() => load('imf_wa_conn', false));
  const [darkMode, setDarkModeState] = useState<boolean>(() => load('imf_dark', false));

  const setWhatsappConnected = useCallback((v: boolean) => {
    setWhatsappConnectedState(v);
    localStorage.setItem('imf_wa_conn', JSON.stringify(v));
  }, []);

  const addMessage = useCallback((m: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    const newMessage: Message = {
      ...m,
      id: uid(),
      timestamp: new Date().toISOString(),
      read: m.sender === 'me'
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const markAsRead = useCallback((leadId: string) => {
    setMessages(prev => prev.map(m => m.leadId === leadId ? { ...m, read: true } : m));
  }, []);

  const setDarkMode = useCallback((v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem('imf_dark', JSON.stringify(v));
    if (v) {
      document.documentElement.classList.add('dark');
      document.body.style.background = '#000000';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.background = '#F5F5F7';
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.background = '#000000';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.background = '#F5F5F7';
    }
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('imf_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('imf_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('imf_props', JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem('imf_appts', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('imf_txns', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('imf_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('imf_msgs', JSON.stringify(messages)); }, [messages]);

  const login = useCallback((email: string, _pw: string) => {
    void _pw;
    const saved = load<User | null>('imf_user', null);
    if (saved) {
      setUser({ ...saved, email });
    } else {
      setUser({ id: uid(), name: 'Novo Corretor', email, creci: 'CRECI 000.000/UF', company: 'Minha Imobiliária', phone: '', bio: '', websiteTitle: 'ImobiPro — Meu Site', avatar: '', logo: '', socialMedia: { instagram: '', facebook: '', youtube: '', linkedin: '', tiktok: '' } });
    }
  }, []);
  const logout = useCallback(() => setUser(null), []);
  const updateUser = useCallback((u: Partial<User>) => setUser(p => p ? { ...p, ...u } : p), []);

  const addLead = useCallback((l: Omit<Lead, 'id' | 'createdAt'>) => setLeads(p => [{ ...l, id: uid(), createdAt: new Date().toISOString() }, ...p]), []);
  const updateLead = useCallback((id: string, u: Partial<Lead>) => setLeads(p => p.map(l => l.id === id ? { ...l, ...u } : l)), []);
  const deleteLead = useCallback((id: string) => setLeads(p => p.filter(l => l.id !== id)), []);
  const moveLead = useCallback((id: string, s: LeadStatus) => setLeads(p => p.map(l => l.id === id ? { ...l, status: s, lastContact: new Date().toISOString() } : l)), []);

  const addProperty = useCallback((p: Omit<Property, 'id'>) => setProperties(prev => [{ ...p, id: uid() }, ...prev]), []);
  const updateProperty = useCallback((id: string, u: Partial<Property>) => setProperties(p => p.map(x => x.id === id ? { ...x, ...u } : x)), []);
  const deleteProperty = useCallback((id: string) => setProperties(p => p.filter(x => x.id !== id)), []);

  const addAppointment = useCallback((a: Omit<Appointment, 'id'>) => setAppointments(p => [{ ...a, id: uid() }, ...p]), []);
  const toggleAppointment = useCallback((id: string) => setAppointments(p => p.map(a => a.id === id ? { ...a, completed: !a.completed } : a)), []);
  const deleteAppointment = useCallback((id: string) => setAppointments(p => p.filter(a => a.id !== id)), []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => setTransactions(p => [{ ...t, id: uid() }, ...p]), []);
  const deleteTransaction = useCallback((id: string) => setTransactions(p => p.filter(t => t.id !== id)), []);

  const addContract = useCallback((c: Omit<Contract, 'id' | 'createdAt'>) => setContracts(p => [{ ...c, id: uid(), createdAt: new Date().toISOString() }, ...p]), []);
  const updateContract = useCallback((id: string, u: Partial<Contract>) => setContracts(p => p.map(c => c.id === id ? { ...c, ...u } : c)), []);
  const deleteContract = useCallback((id: string) => setContracts(p => p.filter(c => c.id !== id)), []);

  return (
    <GlobalContext.Provider value={{
      user, leads, properties, appointments, transactions, contracts,
      messages, whatsappConnected, setWhatsappConnected, addMessage, markAsRead,
      darkMode, setDarkMode,
      login, logout, updateUser, addLead, updateLead, deleteLead, moveLead,
      addProperty, updateProperty, deleteProperty, addAppointment, toggleAppointment, deleteAppointment,
      addTransaction, deleteTransaction, addContract, updateContract, deleteContract,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => { const c = useContext(GlobalContext); if (!c) throw new Error('No context'); return c; };
