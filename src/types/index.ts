export type LeadStatus = 'novo' | 'contato' | 'visita' | 'proposta' | 'fechado';

export const LEAD_STATUSES: { id: LeadStatus; label: string; emoji: string }[] = [
  { id: 'novo', label: 'Novo Lead', emoji: '🔵' },
  { id: 'contato', label: 'Contato Feito', emoji: '💬' },
  { id: 'visita', label: 'Visita Agendada', emoji: '🏠' },
  { id: 'proposta', label: 'Proposta', emoji: '📄' },
  { id: 'fechado', label: 'Fechado', emoji: '🎉' },
];

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; dot: string; light: string }> = {
  novo:     { bg: 'bg-apple-blue/10',   text: 'text-apple-blue',   dot: 'bg-apple-blue',   light: '#0A84FF' },
  contato:  { bg: 'bg-apple-indigo/10', text: 'text-apple-indigo', dot: 'bg-apple-indigo', light: '#5E5CE6' },
  visita:   { bg: 'bg-apple-purple/10', text: 'text-apple-purple', dot: 'bg-apple-purple', light: '#BF5AF2' },
  proposta: { bg: 'bg-apple-pink/10',   text: 'text-apple-pink',   dot: 'bg-apple-pink',   light: '#FF375F' },
  fechado:  { bg: 'bg-apple-green/10',  text: 'text-apple-green',  dot: 'bg-apple-green',  light: '#30D158' },
};

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: LeadStatus;
  source: string;
  value: number;
  commission: number;
  lastContact: string;
  nextFollowUp: string;
  notes: string;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'venda' | 'locação';
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  garage: number;
  image: string;
  images: string[];
  featured: boolean;
  status: 'disponível' | 'vendido' | 'reservado';
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  leadName: string;
  type: 'visita' | 'reunião' | 'follow-up' | 'assinatura';
  notes: string;
  completed: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  status: 'pendente' | 'pago';
}

export interface Contract {
  id: string;
  title: string;
  client: string;
  property: string;
  value: number;
  commission: number;
  status: 'rascunho' | 'ativo' | 'concluido' | 'cancelado';
  type: 'compra_venda' | 'locacao' | 'permuta' | 'cessao';
  startDate: string;
  endDate: string;
  notes: string;
  createdAt: string;
}

export interface SocialMedia {
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  creci: string;
  company: string;
  phone: string;
  bio: string;
  websiteTitle: string;
  avatar: string;
  logo: string;
  socialMedia: SocialMedia;
}

export interface Message {
  id: string;
  leadId: string;
  text: string;
  sender: 'me' | 'lead';
  timestamp: string;
  read: boolean;
}
