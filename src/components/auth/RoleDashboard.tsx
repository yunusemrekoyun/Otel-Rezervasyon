'use client';

import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ShieldCheck, LayoutDashboard, Users, CalendarCheck,
  Settings, ClipboardList, Bell, LineChart, FileText, CreditCard, FileClock,
  User, Calendar, MessageSquare, CheckSquare, DoorOpen, Package,
  Building2, ChevronRight, Sun, Moon, Home, Globe, AlertTriangle, Wrench,
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';
import type { RoleSlug } from '@/lib/auth/constants';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/theme/ThemeContext';
import { OdalarSection } from '@/components/admin/OdalarSection';
import { RoomManager } from '@/components/admin/RoomManager';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminReservations } from '@/components/admin/AdminReservations';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminUserManager } from '@/components/admin/AdminUserManager';
import { AdminOperationsPanel } from '@/components/admin/AdminOperationsPanel';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { CustomerDashboard } from '@/components/customer/CustomerDashboard';
import { CheckinPanel } from '@/components/personel/CheckinPanel';
import { PersonelDashboard } from '@/components/personel/PersonelDashboard';
import { ActiveGuests } from '@/components/personel/ActiveGuests';
import { ConciergePanel } from '@/components/personel/ConciergePanel';
import { TaskList } from '@/components/housekeeping/TaskList';
import { MaintenancePanel } from '@/components/housekeeping/MaintenancePanel';
import { LostItemsPanel } from '@/components/housekeeping/LostItemsPanel';

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
      { id: 'checkinout',   label: 'Giriş / Çıkış',     description: 'Misafir giriş ve çıkış işlemleri ile QR tarama terminali.',                                icon: DoorOpen },
      { id: 'rooms',        label: 'Odalar',              description: 'Oda çeşitlerini, imkanlarını ve medyalarını buradan yönetebilirsiniz.',                    icon: Building2 },
      { id: 'operations',   label: 'Hasar & Kayıp Eşya', description: 'Personelden gelen hasar bildirimleri ve kayıp eşya kayıtlarını buradan yönetin.',           icon: Wrench },
      { id: 'audit',        label: 'İşlem Logları',       description: 'Kritik sistem işlemleri ve yetkili kullanıcı hareketlerini takip edin.',                    icon: FileClock },
      { id: 'settings',     label: 'Sistem Ayarları',     description: 'Kabin fiyatlandırmaları, site ayarları ve genel yapılandırmalar.',                         icon: Settings },
    ],
    personel: [
      { id: 'dashboard', label: 'Personel Paneli',   description: 'Günlük vardiya özetiniz ve aktif bildirimleriniz.',                          icon: ClipboardList },
      { id: 'guests',    label: 'Aktif Misafirler',  description: 'Şu an otelde konaklayan misafirlerin listesi ve istekleri.',                  icon: Users },
      { id: 'rooms',     label: 'Oda Matrisi',       description: 'Tüm odaların anlık durumunu görün ve müsait odadan hızlı rezervasyon alın.',  icon: Building2 },
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
      { id: 'tasks',       label: 'Görev Listesi',       description: 'Size atanmış temizlik görevleri ve tamamlanma durumları.',               icon: CheckSquare },
      { id: 'maintenance', label: 'Hasar Bildirimi',     description: 'Odada tespit ettiğiniz arızaları veya hasarları bildirin.',              icon: AlertTriangle },
      { id: 'lostitems',   label: 'Kayıp Eşya',          description: 'Odada bulduğunuz unutulan eşyaları kayıt altına alın.',                 icon: Package },
    ],
  },
  en: {
    admin: [
      { id: 'overview',     label: 'Overview',          description: 'Track hotel general status, occupancy rates and daily summaries here.',                icon: LayoutDashboard },
      { id: 'users',        label: 'User Management',   description: 'Area where you can manage all staff, accounting and customer accounts.',              icon: Users },
      { id: 'reservations', label: 'All Reservations',  description: 'You can view all reservations in the system, cancel or approve them.',               icon: CalendarCheck },
      { id: 'checkinout',   label: 'Check-in / Out',   description: 'Guest check-in and check-out operations with QR scanning terminal.',                  icon: DoorOpen },
      { id: 'rooms',        label: 'Rooms',             description: 'Manage room types, their amenities and media from here.',                            icon: Building2 },
      { id: 'operations',   label: 'Damage & Lost Items', description: 'Manage damage reports and lost item logs submitted by housekeeping staff.',          icon: Wrench },
      { id: 'audit',        label: 'Audit Logs',        description: 'Track critical system operations and authorized user activity.',                    icon: FileClock },
      { id: 'settings',     label: 'Settings',          description: 'Cabin pricing, site configurations and general structures.',                         icon: Settings },
    ],
    personel: [
      { id: 'dashboard', label: 'Staff Panel',       description: 'Your daily shift summary and active notifications.',                        icon: ClipboardList },
      { id: 'guests',    label: 'Active Guests',     description: 'List and requests of guests currently staying at the hotel.',               icon: Users },
      { id: 'rooms',     label: 'Room Matrix',       description: 'View live room status and create quick reservations from available rooms.', icon: Building2 },
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
      { id: 'tasks',       label: 'Task List',         description: 'Cleaning tasks assigned to you and their completion status.',  icon: CheckSquare },
      { id: 'maintenance', label: 'Damage Report',     description: 'Report malfunctions or damage found in rooms.',               icon: AlertTriangle },
      { id: 'lostitems',   label: 'Lost & Found',      description: 'Log forgotten items found in rooms.',                        icon: Package },
    ],
  },
};

// ── Helper ───────────────────────────────────────────────────────────────────

function emailInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────────

export function RoleDashboard({ user, authSource }: RoleDashboardProps) {
  // Müşteri rolü tamamen farklı bir arayüze sahip
  if (user.roleSlug === 'musteri') {
    return <CustomerDashboard user={user} authSource={authSource} />;
  }

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, mode, setMode } = useTheme();

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
    <div data-mode={mode} className={`flex flex-col md:flex-row min-h-screen panel-root${mode === 'light' ? ' mode-light' : ''}`}>

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════ */}
      <aside className="
        w-full md:w-64 shrink-0 flex flex-col
        panel-sidebar rounded-none
        border-b md:border-b-0 md:border-r
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        z-20
      ">

        {/* Hotel branding */}
        <div className="px-4 pt-4 pb-3 border-b border-m-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white overflow-hidden shrink-0 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" style={{ objectPosition: 'left center' }} />
            </div>
            <div>
              <p className="font-bold text-main text-sm leading-none">Garden Hotel</p>
              <p className="text-[10px] text-subtle mt-1">
                {language === 'tr' ? 'Otel Yönetim Sistemi' : 'Hotel Management System'}
              </p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-m-border">
          <div className="flex items-center gap-3 surface-card px-3 py-2.5">
            <div className="avatar-init w-8 h-8 text-[11px]">{emailInitials(user.email)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-main leading-none">{user.roleName}</p>
              <p className="text-[10px] text-subtle mt-0.5 truncate">{user.email}</p>
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
                      : 'text-muted hover:text-main hover:bg-m-hover border border-transparent'}
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-accent rounded-r-full" />
                  )}
                  <Icon
                    size={16}
                    className={isActive
                      ? 'text-brand-accent'
                      : 'text-subtle group-hover:text-main transition-colors'}
                  />
                  <span className="flex-1 text-left">{menu.label}</span>
                  {isActive && <ChevronRight size={13} className="text-brand-accent/50" />}
                </button>
              );
            })}
          </div>
        </nav>

      </aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">

        {/* Topbar */}
        <div className="topbar-glass">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-main leading-none">{activeTab.label}</h1>
            <p className="text-[11px] text-subtle mt-1.5 max-w-lg leading-relaxed hidden md:block">
              {activeTab.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">

            {/* Home */}
            <button
              onClick={() => router.push('/')}
              title={language === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
              className="btn-secondary h-8 px-2.5 text-xs"
            >
              <Home size={13} />
              <span className="hidden sm:inline">{language === 'tr' ? 'Ana Sayfa' : 'Home'}</span>
            </button>

            {/* Language */}
            <button
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              title={language === 'tr' ? 'Dil Değiştir' : 'Change Language'}
              className="btn-secondary h-8 px-2.5 text-xs font-bold"
            >
              <Globe size={13} />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Theme */}
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              title={mode === 'dark'
                ? (language === 'tr' ? 'Açık Tema' : 'Light Mode')
                : (language === 'tr' ? 'Koyu Tema' : 'Dark Mode')}
              className="btn-secondary h-8 w-8"
            >
              {mode === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
            </button>

            <div className="w-px h-5 bg-m-border mx-0.5" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-8 px-2.5 rounded-lg border border-red-500/20 hover:bg-red-500/8 text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">
                {isLoggingOut
                  ? (language === 'tr' ? 'Çıkılıyor…' : 'Logging out…')
                  : (language === 'tr' ? 'Çıkış' : 'Logout')}
              </span>
            </button>

            {/* Role badge */}
            <div className="badge-accent shrink-0 hidden md:flex ml-1">
              <ShieldCheck size={12} />
              <span>{user.roleName}</span>
            </div>

          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-5">

          {/* ── Rooms ── */}
          {activeTabId === 'rooms' && user.roleSlug === 'admin' ? (
            <OdalarSection />

          /* ── Admin user management ── */
          ) : activeTabId === 'users' && user.roleSlug === 'admin' ? (
            <AdminUserManager tr={language === 'tr'} currentUserId={user.id} />

          /* ── Admin overview ── */
          ) : activeTabId === 'overview' && user.roleSlug === 'admin' ? (
            <AdminOverview user={user} />

          /* ── Admin reservations + availability calendar ── */
          ) : activeTabId === 'reservations' && user.roleSlug === 'admin' ? (
            <AdminReservations tr={language === 'tr'} />

          /* ── Admin operations (damage reports + lost items) ── */
          ) : activeTabId === 'operations' && user.roleSlug === 'admin' ? (
            <AdminOperationsPanel tr={language === 'tr'} />

          /* ── Admin audit logs ── */
          ) : activeTabId === 'audit' && user.roleSlug === 'admin' ? (
            <AuditLogPanel tr={language === 'tr'} />

          /* ── Admin settings ── */
          ) : activeTabId === 'settings' && user.roleSlug === 'admin' ? (
            <AdminSettings tr={language === 'tr'} />

          /* ── Personel dashboard ── */
          ) : activeTabId === 'dashboard' && user.roleSlug === 'personel' ? (
            <PersonelDashboard tr={language === 'tr'} />

          /* ── Personel active guests ── */
          ) : activeTabId === 'guests' && user.roleSlug === 'personel' ? (
            <ActiveGuests tr={language === 'tr'} />

          /* ── Personel room matrix + quick reservation ── */
          ) : activeTabId === 'rooms' && user.roleSlug === 'personel' ? (
            <RoomManager viewMode="card" mode="frontdesk" />

          /* ── Admin check-in / check-out ── */
          ) : activeTabId === 'checkinout' && user.roleSlug === 'admin' ? (
            <CheckinPanel tr={language === 'tr'} />

          /* ── Personel check-in / check-out ── */
          ) : activeTabId === 'checkin' && user.roleSlug === 'personel' ? (
            <CheckinPanel tr={language === 'tr'} />

          /* ── Personel concierge ── */
          ) : activeTabId === 'concierge' && user.roleSlug === 'personel' ? (
            <ConciergePanel tr={language === 'tr'} />

          /* ── Kat Hizmetleri: görev listesi ── */
          ) : activeTabId === 'tasks' && user.roleSlug === 'temizlikci' ? (
            <TaskList tr={language === 'tr'} />

          /* ── Kat Hizmetleri: hasar bildirimi ── */
          ) : activeTabId === 'maintenance' && user.roleSlug === 'temizlikci' ? (
            <MaintenancePanel tr={language === 'tr'} />

          /* ── Kat Hizmetleri: kayıp eşya ── */
          ) : activeTabId === 'lostitems' && user.roleSlug === 'temizlikci' ? (
            <LostItemsPanel tr={language === 'tr'} />

          /* ── Coming soon placeholder ── */
          ) : (
            <div className="surface-panel p-8">
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl surface-card-raised flex items-center justify-center">
                    <ActiveIcon size={28} className="text-subtle" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center">
                    <span className="text-[9px] text-brand-accent font-bold">!</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted">
                    {language === 'tr' ? 'Yapım Aşamasında' : 'Coming Soon'}
                  </p>
                  <p className="text-xs text-subtle max-w-xs leading-relaxed">
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
