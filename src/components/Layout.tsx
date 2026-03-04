import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Wallet,
  Globe, LogOut, ChevronLeft, Kanban,
  Settings, FileText, UserCircle2, Menu, X, MessageSquare
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from './Logo';

// Desktop sidebar nav — all items
const SIDEBAR_NAV = [
  {
    section: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, color: '#0A84FF' },
      { to: '/leads', icon: Users, label: 'Leads', end: false, color: '#5E5CE6' },
      { to: '/pipeline', icon: Kanban, label: 'Pipeline', end: false, color: '#BF5AF2' },
      { to: '/whatsapp', icon: MessageSquare, label: 'WhatsApp', end: false, color: '#30D158' },
      { to: '/properties', icon: Building2, label: 'Imóveis', end: false, color: '#30D158' },
      { to: '/contracts', icon: FileText, label: 'Contratos', end: false, color: '#FF9F0A' },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { to: '/calendar', icon: CalendarDays, label: 'Agenda', end: false, color: '#FF375F' },
      { to: '/financial', icon: Wallet, label: 'Financeiro', end: false, color: '#30D158' },
      { to: '/site', icon: Globe, label: 'Meu Site', end: false, color: '#64D2FF' },
    ],
  },
  {
    section: 'Conta',
    items: [
      { to: '/profile', icon: UserCircle2, label: 'Perfil', end: false, color: '#FF9F0A' },
      { to: '/settings', icon: Settings, label: 'Ajustes', end: false, color: '#8E8E93' },
    ],
  },
];

// Mobile bottom nav — 5 most important
const MOBILE_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/leads', icon: Users, label: 'Leads', end: false },
  { to: '/properties', icon: Building2, label: 'Imóveis', end: false },
  { to: '/contracts', icon: FileText, label: 'Contratos', end: false },
  { to: '/profile', icon: UserCircle2, label: 'Perfil', end: false },
];

const Layout: React.FC = () => {
  const { logout, user, darkMode, messages } = useGlobal();
  const nav = useNavigate();

  const unreadCount = messages.filter(m => !m.read && m.sender === 'lead').length;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bg = darkMode ? '#000000' : '#F5F5F7';
  const sidebar = darkMode ? 'rgba(18,18,20,0.95)' : 'rgba(255,255,255,0.92)';
  const border = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const textPrimary = darkMode ? '#FFFFFF' : '#1D1D1F';
  const textSecondary = darkMode ? '#8E8E93' : '#AEAEB2';
  const textMuted = darkMode ? '#636366' : '#6E6E73';
  const sectionTitle = darkMode ? '#48484A' : '#C7C7CC';
  const hoverBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const handleLogout = () => { logout(); nav('/login'); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: bg }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[256px]'}`}
        style={{ background: sidebar, borderRight: `1px solid ${border}` }}
      >
        {/* Brand */}
        <div
          className={`flex items-center h-[64px] shrink-0 px-3 ${collapsed ? 'justify-center' : 'gap-3 px-4'}`}
          style={{ borderBottom: `1px solid ${border}` }}
        >
          {collapsed ? (
            /* Collapsed: just the icon acts as expand button */
            <button
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 bg-white rounded-[11px] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] shrink-0 hover:opacity-80 transition-opacity p-1"
              title="Expandir menu"
            >
              <Logo size={28} />
            </button>
          ) : (
            /* Expanded: logo + name + collapse button */
            <>
              <div className="w-9 h-9 bg-white rounded-[11px] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] shrink-0 p-1">
                <Logo size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[15px] font-bold tracking-tight leading-none" style={{ color: textPrimary }}>ImobiPro</h1>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: textSecondary }}>CRM Inteligente</p>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-[8px] transition-all shrink-0 hover:opacity-80"
                style={{ color: textSecondary, background: hoverBg }}
                title="Recolher menu"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          {SIDEBAR_NAV.map((section, si) => (
            <div key={section.section} className={si > 0 ? 'pt-2' : ''}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: sectionTitle }}>
                  {section.section}
                </p>
              )}
              {collapsed && si > 0 && (
                <div className="mx-2 my-2" style={{ borderTop: `1px solid ${border}` }} />
              )}
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={`flex items-center gap-3 ${collapsed ? 'justify-center px-0 mx-1' : 'px-3'} py-2.5 rounded-[12px] text-[13.5px] font-medium transition-all duration-150 relative group mb-0.5`}
                  style={({ isActive }) => ({
                    background: isActive ? `${item.color}14` : 'transparent',
                    color: isActive ? item.color : textMuted,
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: item.color }}
                        />
                      )}
                      {isActive && collapsed && (
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-t-full"
                          style={{ background: item.color }}
                        />
                      )}
                      <div className="relative">
                        <item.icon
                          className="w-[19px] h-[19px] shrink-0 transition-transform duration-150 group-hover:scale-110"
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        {item.to === '/whatsapp' && unreadCount > 0 && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold ring-2 ring-white dark:ring-black">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="font-semibold">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              {si < SIDEBAR_NAV.length - 1 && !collapsed && (
                <div className="mx-3 my-2" style={{ borderTop: `1px solid ${border}` }} />
              )}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div
          className={`shrink-0 p-3`}
          style={{ borderTop: `1px solid ${border}` }}
        >
          {collapsed ? (
            /* Collapsed: only avatar, click goes to profile */
            <div className="flex flex-col items-center gap-2">
              <NavLink to="/profile" title={user?.name} className="shrink-0">
                {user?.avatar ? (
                  <div className="w-9 h-9 rounded-[11px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-[11px] gradient-blue flex items-center justify-center text-white font-bold text-[13px] shadow-[0_2px_8px_rgba(10,132,255,0.25)]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </NavLink>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-[8px] transition-all hover:bg-red-500/10"
                style={{ color: textSecondary }}
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Expanded: avatar + name + logout */
            <div className="flex items-center gap-3">
              <NavLink to="/profile" className="shrink-0">
                {user?.avatar ? (
                  <div className="w-9 h-9 rounded-[11px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-[11px] gradient-blue flex items-center justify-center text-white font-bold text-[13px] shadow-[0_2px_8px_rgba(10,132,255,0.25)]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </NavLink>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold truncate leading-none" style={{ color: textPrimary }}>{user?.name}</p>
                <p className="text-[10.5px] truncate mt-0.5" style={{ color: textSecondary }}>{user?.creci || user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-[9px] transition-all hover:bg-red-500/10 shrink-0"
                style={{ color: textSecondary }}
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Slide-over Menu ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] z-[90] flex flex-col"
            style={{ background: darkMode ? '#1C1C1E' : '#fff' }}
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-[11px] flex items-center justify-center p-1 shadow-sm">
              <Logo size={24} />
            </div>
            <div>
              <h1 className="text-[15px] font-bold" style={{ color: textPrimary }}>ImobiPro</h1>
              <p className="text-[10px]" style={{ color: textSecondary }}>CRM Inteligente</p>
            </div>
          </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full" style={{ color: textSecondary }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {SIDEBAR_NAV.map((section, si) => (
                <div key={section.section} className={si > 0 ? 'pt-3' : ''}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: sectionTitle }}>
                    {section.section}
                  </p>
                  {section.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-[12px] text-[14px] font-semibold mb-0.5 transition-all"
                      style={({ isActive }) => ({
                        background: isActive ? `${item.color}14` : 'transparent',
                        color: isActive ? item.color : textMuted,
                      })}
                    >
                      <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.9} />
                      {item.label}
                    </NavLink>
                  ))}
                  {si < SIDEBAR_NAV.length - 1 && (
                    <div className="mx-3 mt-3" style={{ borderTop: `1px solid ${border}` }} />
                  )}
                </div>
              ))}
            </nav>

            <div className="p-4" style={{ borderTop: `1px solid ${border}` }}>
              <div className="flex items-center gap-3 mb-4">
                {user?.avatar ? (
                  <div className="w-10 h-10 rounded-[12px] overflow-hidden">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-[12px] gradient-blue flex items-center justify-center text-white font-bold text-[14px]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: textPrimary }}>{user?.name}</p>
                  <p className="text-[11px] truncate" style={{ color: textSecondary }}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[14px] font-semibold text-red-500 bg-red-500/[0.06] hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile Header */}
        <header
          className="lg:hidden shrink-0 h-[56px] px-4 flex items-center justify-between z-50 sticky top-0"
          style={{
            background: darkMode ? 'rgba(18,18,20,0.92)' : 'rgba(255,255,255,0.92)',
            borderBottom: `1px solid ${border}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-[10px]" style={{ color: textMuted }}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-[9px] flex items-center justify-center p-1 shadow-sm">
              <Logo size={20} />
            </div>
            <span className="text-[15px] font-bold tracking-tight" style={{ color: textPrimary }}>ImobiPro</span>
          </div>

          <NavLink to="/profile" className="shrink-0">
            {user?.avatar ? (
              <div className="w-8 h-8 rounded-[9px] overflow-hidden">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-[9px] gradient-blue flex items-center justify-center text-white font-bold text-[12px]">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </NavLink>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="lg:hidden shrink-0 z-50"
          style={{
            background: darkMode ? 'rgba(18,18,20,0.95)' : 'rgba(255,255,255,0.95)',
            borderTop: `1px solid ${border}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-stretch justify-around pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
            {MOBILE_NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center gap-[3px] flex-1 py-1 transition-all duration-200"
                style={({ isActive }) => ({ color: isActive ? '#0A84FF' : textSecondary })}
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative p-1.5 rounded-[10px] transition-all ${isActive ? 'bg-apple-blue/10' : ''}`}>
                      <item.icon
                        className={`w-[22px] h-[22px] transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                    <span className={`text-[9.5px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
