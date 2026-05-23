'use client';

import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ShieldCheck, LayoutDashboard, Users, CalendarCheck,
  Settings, ClipboardList, Bell, LineChart, FileText, CreditCard,
  User, Calendar, MessageSquare, CheckSquare, DoorOpen, Package,
  Palette, Building2, ChevronRight,
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';
import type { RoleSlug } from '@/lib/auth/constants';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme, THEMES } from '@/theme/ThemeContext';
import { OdalarSection } from '@/components/admin/OdalarSection';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminReservations } from '@/components/admin/AdminReservations';
import { CustomerReservations } from '@/components/customer/CustomerReservations';

// ── Types ────────────────────────────────────────────────────────────────────

interface RoleDashboardProps {
  user: AuthUser;
  authSource: 'access' | 'refresh';
}

interface MenuTab {
  id: string;
  label: string;
  description: string;
  icon: ElementType;
}

// ── Menu definitions ─────────────────────────────────────────────────────────

const ROLE_MENUS: Record<'tr' | 'en', Record<RoleSlug, MenuTab[]>> = {
  tr: {
    admin: [
      { id: 'overview',     label: 'Genel Bakış',        description: 'Otel genel durumunu, doluluk oranlarını ve günlük özetleri buradan takip edebilirsiniz.',  icon: LayoutDashboard },
      { id: 'users',        label: 'Kullanıcı Yönetimi', description: 'Tüm personel, muhasebe ve müşteri hesaplarını yönetebileceğiniz alan.',                   icon: Users },
      { id: 'reservations', label: 'Tüm Rezervasyonlar', description: 'Sistemdeki tüm rezervasyonları görüntüleyebilir, iptal veya onay işlemlerini yapabilirsiniz.', icon: CalendarCheck },
      { id: 'rooms',        label: 'Odalar',              description: 'Oda çeşitlerini, imkanlarını ve medyalarını buradan yönetebilirsiniz.',                    icon: DoorOpen },
      { id: 'settings',     label: 'Sistem Ayarları',     description: 'Kabin fiyatlandırmaları, site ayarları ve genel yapılandırmalar.',                         icon: Settings },
      { id: 'appearance',   label: 'Görünüm',             description: 'Sitenin global renk paletini ve temasını değiştirin.',                                     icon: Palette },
    ],
    personel: [
      { id: 'dashboard', label: 'Personel Paneli',   description: 'Günlük vardiya özetiniz ve aktif bildirimleriniz.',                          icon: ClipboardList },
      { id: 'guests',    label: 'Aktif Misafirler',  description: 'Şu an otelde konaklayan misafirlerin listesi ve istekleri.',                  icon: Users },
      { id: 'checkin',   label: 'Giriş / Çıkış',    description: 'Misafir check-in ve check-out işlemlerini yapabileceğiniz ekran.',           icon: DoorOpen },
      { id: 'concierge', label: 'Müşteri Talepleri', description: 'Misafirlerden gelen oda servisi ve diğer taleplerin yönetimi.',               icon: Bell },
    ],
    muhasebe: [
      { id: 'dashboard', label: 'Finansal Özet', description: 'Aylık gelir/gider tabloları ve finansal durum özeti.', icon: LineChart },
      { id: 'invoices',  label: 'Faturalar',     description: 'Kesilen ve bekleyen faturaların yönetimi.',            icon: FileText },
      { id: 'expenses',  label: 'Giderler',      description: 'Otel içi harcamalar, maaşlar ve fatura ödemelerinin girişi.', icon: CreditCard },
      { id: 'reports',   label: 'Raporlar',      description: 'Dönemsel kar/zarar raporları ve muhasebe dökümleri.',  icon: LayoutDashboard },
    ],
    musteri: [
      { id: 'profile',       label: 'Profilim',           description: 'Kişisel bilgileriniz, şifre değiştirme ve iletişim ayarlarınız.',   icon: User },
      { id: 'reservations',  label: 'Rezervasyonlarım',   description: 'Geçmiş ve gelecek konaklamalarınızın detayları.',                    icon: Calendar },
      { id: 'support',       label: 'Destek & İletişim',  description: 'Otel yönetimiyle iletişime geçin veya taleplerinizi iletin.',        icon: MessageSquare },
    ],
    temizlikci: [
      { id: 'tasks',     label: 'Bugünkü Görevler', description: 'Size atanmış günlük temizlik ve bakım görevleri.',                               icon: CheckSquare },
      { id: 'cabins',    label: 'Kabin Durumları',  description: 'Hangi kabinlerin temizlenmesi gerektiği, hangilerinin hazır olduğu bilgisi.',    icon: DoorOpen },
      { id: 'inventory', label: 'Malzeme Durumu',   description: 'Temizlik malzemesi stok durumu ve yeni malzeme talebi ekranı.',                  icon: Package },
    ],
  },
  en: {
    admin: [
      { id: 'overview',     label: 'Overview',          description: 'Track hotel general status, occupancy rates and daily summaries here.',                icon: LayoutDashboard },
      { id: 'users',        label: 'User Management',   description: 'Area where you can manage all staff, accounting and customer accounts.',              icon: Users },
      { id: 'reservations', label: 'All Reservations',  description: 'You can view all reservations in the system, cancel or approve them.',               icon: CalendarCheck },
      { id: 'rooms',        label: 'Rooms',             description: 'Manage room types, their amenities and media from here.',                            icon: DoorOpen },
      { id: 'settings',     label: 'Settings',          description: 'Cabin pricing, site configurations and general structures.',                         icon: Settings },
      { id: 'appearance',   label: 'Appearance',        description: 'Change the global color palette and theme of the site.',                             icon: Palette },
    ],
    personel: [
      { id: 'dashboard', label: 'Staff Panel',       description: 'Your daily shift summary and active notifications.',                        icon: ClipboardList },
      { id: 'guests',    label: 'Active Guests',     description: 'List and requests of guests currently staying at the hotel.',               icon: Users },
      { id: 'checkin',   label: 'Check-in / Out',   description: 'Screen where you can perform guest check-in and check-out operations.',     icon: DoorOpen },
      { id: 'concierge', label: 'Customer Requests', description: 'Management of room service and other requests from guests.',               icon: Bell },
    ],
    muhasebe: [
      { id: 'dashboard', label: 'Financial Summary', description: 'Monthly income/expense tables and financial status summary.',      icon: LineChart },
      { id: 'invoices',  label: 'Invoices',          description: 'Management of issued and pending invoices.',                       icon: FileText },
      { id: 'expenses',  label: 'Expenses',          description: 'Entry of hotel expenses, salaries and invoice payments.',          icon: CreditCard },
      { id: 'reports',   label: 'Reports',           description: 'Periodic profit/loss reports and accounting documents.',           icon: LayoutDashboard },
    ],
    musteri: [
      { id: 'profile',      label: 'My Profile',       description: 'Your personal information, password change and communication settings.', icon: User },
      { id: 'reservations', label: 'My Reservations',  description: 'Details of your past and future stays.',                                icon: Calendar },
      { id: 'support',      label: 'Support & Contact', description: 'Contact hotel management or submit your requests.',                     icon: MessageSquare },
    ],
    temizlikci: [
      { id: 'tasks',     label: "Today's Tasks",   description: 'Daily cleaning and maintenance tasks assigned to you.',                       icon: CheckSquare },
      { id: 'cabins',    label: 'Cabin Statuses',  description: 'Information on which cabins need cleaning and which are ready.',             icon: DoorOpen },
      { id: 'inventory', label: 'Material Status', description: 'Cleaning material stock status and new material request screen.',            icon: Package },
    ],
  },
};

// ── Helper ───────────────────────────────────────────────────────────────────

function emailInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────────

export function RoleDashboard({ user, authSource }: RoleDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const roleMenus = ROLE_MENUS[language][user.roleSlug] ?? ROLE_MENUS[language].musteri;
  const [activeTabId, setActiveTabId] = useState(roleMenus[0]?.id);

  useEffect(() => {
    if (authSource === 'refresh') {
      fetch('/api/auth/refresh', { method: 'POST' }).catch(() => undefined);
    }
  }, [authSource]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/');
      router.refresh();
    }
  };

  const activeTab = roleMenus.find(m => m.id === activeTabId) ?? roleMenus[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--app-base)] text-white">

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════ */}
      <aside className="
        w-full md:w-64 shrink-0 flex flex-col
        panel-glass rounded-none
        border-b md:border-b-0 md:border-r border-white/8
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        z-20
      ">

        {/* Hotel branding */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
              <Building2 size={17} className="text-brand-accent" />
            </div>
            <div>
              <p className="font-bold text-white/95 text-sm leading-none">WoodNest</p>
              <p className="text-[10px] text-white/30 mt-1">
                {language === 'tr' ? 'Otel Yönetim Sistemi' : 'Hotel Management System'}
              </p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
            <div className="avatar-init w-8 h-8 text-[11px]">{emailInitials(user.email)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white/80 leading-none">{user.roleName}</p>
              <p className="text-[10px] text-white/35 mt-0.5 truncate">{user.email}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.45)]" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 no-scrollbar">
          <p className="section-title px-3 mb-2">
            {language === 'tr' ? 'Menü' : 'Navigation'}
          </p>
          <div className="space-y-0.5">
            {roleMenus.map((menu) => {
              const Icon = menu.icon;
              const isActive = activeTabId === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveTabId(menu.id)}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-2.5
                    rounded-xl text-sm font-medium transition-all duration-200
                    cursor-pointer group
                    ${isActive
                      ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/15'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'}
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-accent rounded-r-full" />
                  )}
                  <Icon
                    size={16}
                    className={isActive
                      ? 'text-brand-accent'
                      : 'text-white/30 group-hover:text-white/60 transition-colors'}
                  />
                  <span className="flex-1 text-left">{menu.label}</span>
                  {isActive && <ChevronRight size={13} className="text-brand-accent/50" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-3 border-t border-white/5 space-y-1.5">
          <button
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            className="btn-secondary w-full justify-between px-3 py-2 text-xs rounded-xl"
          >
            <span className="text-white/40">
              {language === 'tr' ? 'Dil / Language' : 'Language / Dil'}
            </span>
            <span className="bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-md text-[10px] font-bold border border-brand-accent/20">
              {language.toUpperCase()}
            </span>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn-danger w-full px-3 py-2.5 text-xs rounded-xl"
          >
            <LogOut size={14} />
            <span>
              {isLoggingOut
                ? (language === 'tr' ? 'Çıkılıyor...' : 'Logging out...')
                : (language === 'tr' ? 'Güvenli Çıkış' : 'Secure Logout')}
            </span>
          </button>
        </div>

      </aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">

        {/* Topbar */}
        <div className="topbar-glass">
          <div>
            <h1 className="text-base font-bold text-white/95 leading-none">{activeTab.label}</h1>
            <p className="text-[11px] text-white/30 mt-1.5 max-w-lg leading-relaxed hidden md:block">
              {activeTab.description}
            </p>
          </div>
          <div className="badge-accent shrink-0">
            <ShieldCheck size={12} />
            <span>{user.roleName}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-5 md:p-8">

          {/* ── Appearance ── */}
          {activeTabId === 'appearance' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {THEMES.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id as Parameters<typeof setTheme>[0])}
                    className={`relative p-4 rounded-card border cursor-pointer transition-all ${
                      theme === t.id
                        ? 'bg-surface-glass border-brand-accent shadow-lg shadow-brand-accent/10'
                        : 'bg-surface-glass border-border-subtle hover:border-border-glass hover:bg-surface-glass-hover'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-semibold">{t.name}</span>
                      {theme === t.id && (
                        <span className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(255,183,128,0.8)]" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-7 rounded-md" style={{ backgroundColor: t.base }} />
                      <div className="w-7 h-7 rounded-md" style={{ backgroundColor: t.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          /* ── Rooms ── */
          ) : activeTabId === 'rooms' ? (
            <OdalarSection />

          /* ── Admin overview ── */
          ) : activeTabId === 'overview' && user.roleSlug === 'admin' ? (
            <AdminOverview user={user} />

          /* ── Admin reservations + availability calendar ── */
          ) : activeTabId === 'reservations' && user.roleSlug === 'admin' ? (
            <AdminReservations tr={language === 'tr'} />

          /* ── Customer reservations ── */
          ) : activeTabId === 'reservations' && user.roleSlug === 'musteri' ? (
            <CustomerReservations user={user} tr={language === 'tr'} />

          /* ── Coming soon placeholder ── */
          ) : (
            <div className="panel-glass-dashed">
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-surface-glass border border-border-glass flex items-center justify-center">
                    <ActiveIcon size={28} className="text-white/20" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center">
                    <span className="text-[9px] text-brand-accent font-bold">!</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white/50">
                    {language === 'tr' ? 'Yapım Aşamasında' : 'Coming Soon'}
                  </p>
                  <p className="text-xs text-white/25 max-w-xs leading-relaxed">
                    {language === 'tr'
                      ? `${activeTab.label} ekranı yakında aktif olacak.`
                      : `The ${activeTab.label} screen will be active soon.`}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
