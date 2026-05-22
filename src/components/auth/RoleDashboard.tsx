'use client';

import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, ShieldCheck, LayoutDashboard, Users, CalendarCheck, 
  Settings, ClipboardList, Bell, LineChart, FileText, CreditCard, 
  User, Calendar, MessageSquare, CheckSquare, DoorOpen, Package 
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';
import type { RoleSlug } from '@/lib/auth/constants';
import { useLanguage } from '@/i18n/LanguageContext';

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

const ROLE_MENUS: Record<'tr' | 'en', Record<RoleSlug, MenuTab[]>> = {
  tr: {
    admin: [
      { id: 'overview', label: 'Genel Bakış', description: 'Otel genel durumunu, doluluk oranlarını ve günlük özetleri buradan takip edebilirsiniz.', icon: LayoutDashboard },
      { id: 'users', label: 'Kullanıcı Yönetimi', description: 'Tüm personel, muhasebe ve müşteri hesaplarını yönetebileceğiniz alan.', icon: Users },
      { id: 'reservations', label: 'Tüm Rezervasyonlar', description: 'Sistemdeki tüm rezervasyonları görüntüleyebilir, iptal veya onay işlemlerini yapabilirsiniz.', icon: CalendarCheck },
      { id: 'settings', label: 'Sistem Ayarları', description: 'Kabin fiyatlandırmaları, site ayarları ve genel yapılandırmalar.', icon: Settings },
    ],
    personel: [
      { id: 'dashboard', label: 'Personel Paneli', description: 'Günlük vardiya özetiniz ve aktif bildirimleriniz.', icon: ClipboardList },
      { id: 'guests', label: 'Aktif Misafirler', description: 'Şu an otelde konaklayan misafirlerin listesi ve istekleri.', icon: Users },
      { id: 'checkin', label: 'Giriş / Çıkış', description: 'Misafir check-in ve check-out işlemlerini yapabileceğiniz ekran.', icon: DoorOpen },
      { id: 'concierge', label: 'Müşteri Talepleri', description: 'Misafirlerden gelen oda servisi ve diğer taleplerin yönetimi.', icon: Bell },
    ],
    muhasebe: [
      { id: 'dashboard', label: 'Finansal Özet', description: 'Aylık gelir/gider tabloları ve finansal durum özeti.', icon: LineChart },
      { id: 'invoices', label: 'Faturalar', description: 'Kesilen ve bekleyen faturaların yönetimi.', icon: FileText },
      { id: 'expenses', label: 'Giderler', description: 'Otel içi harcamalar, maaşlar ve fatura ödemelerinin girişi.', icon: CreditCard },
      { id: 'reports', label: 'Raporlar', description: 'Dönemsel kar/zarar raporları ve muhasebe dökümleri.', icon: LayoutDashboard },
    ],
    musteri: [
      { id: 'profile', label: 'Profilim', description: 'Kişisel bilgileriniz, şifre değiştirme ve iletişim ayarlarınız.', icon: User },
      { id: 'reservations', label: 'Rezervasyonlarım', description: 'Geçmiş ve gelecek konaklamalarınızın detayları.', icon: Calendar },
      { id: 'support', label: 'Destek & İletişim', description: 'Otel yönetimiyle iletişime geçin veya taleplerinizi iletin.', icon: MessageSquare },
    ],
    temizlikci: [
      { id: 'tasks', label: 'Bugünkü Görevler', description: 'Size atanmış günlük temizlik ve bakım görevleri.', icon: CheckSquare },
      { id: 'cabins', label: 'Kabin Durumları', description: 'Hangi kabinlerin temizlenmesi gerektiği, hangilerinin hazır olduğu bilgisi.', icon: DoorOpen },
      { id: 'inventory', label: 'Malzeme Durumu', description: 'Temizlik malzemesi stok durumu ve yeni malzeme talebi ekranı.', icon: Package },
    ]
  },
  en: {
    admin: [
      { id: 'overview', label: 'Overview', description: 'Track hotel general status, occupancy rates and daily summaries here.', icon: LayoutDashboard },
      { id: 'users', label: 'User Management', description: 'Area where you can manage all staff, accounting and customer accounts.', icon: Users },
      { id: 'reservations', label: 'All Reservations', description: 'You can view all reservations in the system, cancel or approve them.', icon: CalendarCheck },
      { id: 'settings', label: 'System Settings', description: 'Cabin pricing, site settings and general configurations.', icon: Settings },
    ],
    personel: [
      { id: 'dashboard', label: 'Staff Panel', description: 'Your daily shift summary and active notifications.', icon: ClipboardList },
      { id: 'guests', label: 'Active Guests', description: 'List and requests of guests currently staying at the hotel.', icon: Users },
      { id: 'checkin', label: 'Check-in / Out', description: 'Screen where you can perform guest check-in and check-out operations.', icon: DoorOpen },
      { id: 'concierge', label: 'Customer Requests', description: 'Management of room service and other requests from guests.', icon: Bell },
    ],
    muhasebe: [
      { id: 'dashboard', label: 'Financial Summary', description: 'Monthly income/expense tables and financial status summary.', icon: LineChart },
      { id: 'invoices', label: 'Invoices', description: 'Management of issued and pending invoices.', icon: FileText },
      { id: 'expenses', label: 'Expenses', description: 'Entry of hotel expenses, salaries and invoice payments.', icon: CreditCard },
      { id: 'reports', label: 'Reports', description: 'Periodic profit/loss reports and accounting documents.', icon: LayoutDashboard },
    ],
    musteri: [
      { id: 'profile', label: 'My Profile', description: 'Your personal information, password change and communication settings.', icon: User },
      { id: 'reservations', label: 'My Reservations', description: 'Details of your past and future stays.', icon: Calendar },
      { id: 'support', label: 'Support & Contact', description: 'Contact hotel management or submit your requests.', icon: MessageSquare },
    ],
    temizlikci: [
      { id: 'tasks', label: 'Today\'s Tasks', description: 'Daily cleaning and maintenance tasks assigned to you.', icon: CheckSquare },
      { id: 'cabins', label: 'Cabin Statuses', description: 'Information on which cabins need cleaning and which are ready.', icon: DoorOpen },
      { id: 'inventory', label: 'Material Status', description: 'Cleaning material stock status and new material request screen.', icon: Package },
    ]
  }
};

export function RoleDashboard({ user, authSource }: RoleDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  
  const roleMenus = ROLE_MENUS[language][user.roleSlug] || ROLE_MENUS[language].musteri;
  const [activeTabId, setActiveTabId] = useState(roleMenus[0]?.id);

  useEffect(() => {
    if (authSource === 'refresh') {
      fetch('/api/auth/refresh', {
        method: 'POST',
      }).catch(() => undefined);
    }
  }, [authSource]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/');
      router.refresh();
    }
  };

  const activeTab = roleMenus.find(m => m.id === activeTabId) || roleMenus[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#070f12] text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 glass-panel border-r border-white/10 flex flex-col z-20 shadow-2xl relative md:min-h-screen">
        <div className="p-6 border-b border-white/10 shrink-0">
          <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
            <ShieldCheck size={13} />
            <span>{user.roleName} {language === 'tr' ? 'Panel' : 'Dashboard'}</span>
          </div>
          <p className="text-sm text-white/60 truncate" title={user.email}>{user.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {roleMenus.map((menu) => {
            const Icon = menu.icon;
            const isActive = activeTabId === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveTabId(menu.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20 shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-accent' : 'text-white/40'} />
                {menu.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
          <button
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer"
          >
            <span>{language === 'tr' ? 'Language' : 'Dil'}</span>
            <span className="bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/30">
              {language === 'tr' ? 'TR' : 'EN'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-xs font-semibold hover:bg-white/10 hover:text-red-400 transition-all disabled:opacity-50 cursor-pointer"
          >
            <LogOut size={16} />
            <span>{isLoggingOut ? (language === 'tr' ? 'Çıkılıyor...' : 'Logging out...') : (language === 'tr' ? 'Güvenli Çıkış' : 'Secure Logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 relative overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto space-y-8 mt-4 md:mt-10">
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white/95">
              {activeTab.label}
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-2xl leading-relaxed">
              {activeTab.description}
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-white/5 border-dashed">
            <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 opacity-70">
              <div className="bg-white/5 p-4 rounded-full border border-white/10">
                <ActiveIcon size={32} className="text-white/40" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">
                  {language === 'tr' ? 'Bu ekran henüz yapım aşamasındadır.' : 'This screen is currently under construction.'}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {language === 'tr' ? `${activeTab.label} ile ilgili işlemler buraya eklenecektir.` : `Operations related to ${activeTab.label} will be added here.`}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
