'use client';

import {
  CalendarCheck, BedDouble, TrendingUp, LogIn,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Clock,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { AuthUser } from '@/lib/auth/session';

// ── Static demo data ────────────────────────────────────────────────────────

const STATS = [
  {
    id: 'reservations',
    tr: { label: 'Toplam Rezervasyon', sub: 'Bu ay 31 yeni rezervasyon eklendi' },
    en: { label: 'Total Reservations', sub: '31 new reservations added this month' },
    value: '248',
    change: '+12%',
    up: true,
    Icon: CalendarCheck,
  },
  {
    id: 'rooms',
    tr: { label: 'Aktif Oda Sayısı', sub: '4 oda şu an bakım sürecinde' },
    en: { label: 'Active Rooms', sub: '4 rooms currently under maintenance' },
    value: '32',
    change: '+3',
    up: true,
    Icon: BedDouble,
  },
  {
    id: 'occupancy',
    tr: { label: 'Doluluk Oranı', sub: 'Geçen aya kıyasla arttı' },
    en: { label: 'Occupancy Rate', sub: 'Increased compared to last month' },
    value: '87%',
    change: '+5%',
    up: true,
    Icon: TrendingUp,
  },
  {
    id: 'checkins',
    tr: { label: "Bugünkü Girişler", sub: '5 check-out bugün planlandı' },
    en: { label: "Today's Check-ins", sub: '5 check-outs scheduled today' },
    value: '8',
    change: '-2',
    up: false,
    Icon: LogIn,
  },
] as const;

const RESERVATIONS = [
  { id: 'r1', guest: 'Ahmet Yılmaz',  room: 'Sultan Suit',     dates: '22–25 May', status: 'confirmed' as const, price: '₺4.800' },
  { id: 'r2', guest: 'Sarah Johnson', room: 'Orman Evi',        dates: '23–26 May', status: 'pending'   as const, price: '₺3.200' },
  { id: 'r3', guest: 'Kemal Demir',   room: 'Göl Manzarası',   dates: '24–28 May', status: 'confirmed' as const, price: '₺6.400' },
  { id: 'r4', guest: 'Emily Chen',    room: 'Jakuzi Suit',      dates: '25–27 May', status: 'cancelled' as const, price: '₺2.900' },
  { id: 'r5', guest: 'Mehmet Kaya',   room: 'Balayı Köşkü',    dates: '26–30 May', status: 'confirmed' as const, price: '₺8.000' },
];

const ACTIVITIES = [
  {
    id: 'a1', actor: 'Zeynep T.',
    action: { tr: 'yeni rezervasyon oluşturdu', en: 'created a new reservation' },
    target: '#RES-2891',
    time: { tr: '2 dk önce', en: '2 min ago' },
  },
  {
    id: 'a2', actor: 'Mehmet A.',
    action: { tr: 'check-in tamamladı', en: 'completed check-in' },
    target: 'Sultan Suit',
    time: { tr: '18 dk önce', en: '18 min ago' },
  },
  {
    id: 'a3', actor: 'Admin',
    action: { tr: 'fiyat güncelledi', en: 'updated room pricing' },
    target: 'Sultan Suit +%10',
    time: { tr: '1 sa önce', en: '1 hr ago' },
  },
  {
    id: 'a4', actor: 'Ayşe K.',
    action: { tr: 'destek talebi açtı', en: 'opened support ticket' },
    target: '#TKT-442',
    time: { tr: '2 sa önce', en: '2 hrs ago' },
  },
  {
    id: 'a5', actor: 'Can B.',
    action: { tr: 'check-out yaptı', en: 'checked out' },
    target: 'Orman Evi',
    time: { tr: '3 sa önce', en: '3 hrs ago' },
  },
];

const STATUS_STYLE = {
  confirmed: 'tag tag-success',
  pending:   'tag tag-warning',
  cancelled: 'tag tag-danger',
} as const;

const STATUS_LABEL = {
  confirmed: { tr: 'Onaylı',     en: 'Confirmed' },
  pending:   { tr: 'Beklemede',  en: 'Pending'   },
  cancelled: { tr: 'İptal',      en: 'Cancelled' },
} as const;

// ── Helper ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────────

export function AdminOverview({ user }: { user: AuthUser }) {
  const { language } = useLanguage();
  const tr = language === 'tr';

  const today = new Date().toLocaleDateString(tr ? 'tr-TR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="space-y-6">

      {/* ── Greeting ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white/95">
          {tr ? 'Hoş geldin 👋' : 'Welcome back 👋'}
        </h2>
        <p className="text-sm text-white/35 mt-0.5 capitalize">{today}</p>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ id, tr: trData, en: enData, value, change, up, Icon }) => (
          <div key={id} className="stat-card">
            <div className="flex items-start justify-between">
              {/* Icon */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Icon size={18} className="text-brand-accent" />
              </div>
              {/* Change pill */}
              <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border ${
                up
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {change}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-black text-white tracking-tight tabular-nums leading-none">
                {value}
              </p>
              <p className="text-xs font-medium text-white/50">
                {tr ? trData.label : enData.label}
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/[0.06]">
              <p className="text-[10px] text-white/30">
                {tr ? trData.sub : enData.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_284px] gap-5">

        {/* Recent Reservations */}
        <div className="panel-glass p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white/95 text-sm">
                {tr ? 'Son Rezervasyonlar' : 'Recent Reservations'}
              </h3>
              <p className="section-title mt-0.5">
                {tr ? 'Son 7 günün özeti' : 'Last 7 days summary'}
              </p>
            </div>
            <button className="btn-secondary px-3 py-1.5 rounded-lg text-xs">
              {tr ? 'Tümünü gör →' : 'View all →'}
            </button>
          </div>

          <div>
            {RESERVATIONS.map(r => (
              <div
                key={r.id}
                className="group flex items-center gap-4 py-3.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0"
              >
                <div className="avatar-init w-9 h-9 text-[11px] shrink-0">
                  {initials(r.guest)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate leading-none">
                    {r.guest}
                  </p>
                  <p className="text-[11px] text-white/35 mt-1 flex items-center gap-1.5">
                    <span>{r.room}</span>
                    <span className="text-white/15">·</span>
                    <span>{r.dates}</span>
                  </p>
                </div>
                <span className={STATUS_STYLE[r.status]}>
                  {tr ? STATUS_LABEL[r.status].tr : STATUS_LABEL[r.status].en}
                </span>
                <span className="text-sm font-bold text-white/75 shrink-0 tabular-nums w-16 text-right">
                  {r.price}
                </span>
                <button className="btn-icon w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="panel-glass p-5">
          <div className="mb-5">
            <h3 className="font-bold text-white/95 text-sm">
              {tr ? 'Son Aktivite' : 'Recent Activity'}
            </h3>
            <p className="section-title mt-0.5">
              {tr ? 'Anlık güncellemeler' : 'Live updates'}
            </p>
          </div>

          <div>
            {ACTIVITIES.map((act, i) => (
              <div key={act.id} className="flex gap-3 pb-5 last:pb-0">
                {/* Avatar + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="avatar-init w-8 h-8 text-[10px]"
                    style={{ boxShadow: '0 0 0 3px var(--app-base)' }}
                  >
                    {initials(act.actor)}
                  </div>
                  {i < ACTIVITIES.length - 1 && (
                    <div
                      className="w-px flex-1 mt-2 min-h-[16px]"
                      style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--app-accent) 25%, transparent), transparent)' }}
                    />
                  )}
                </div>
                {/* Content */}
                <div className="min-w-0 pt-0.5">
                  <p className="text-[12px] text-white/70 leading-relaxed">
                    <span className="font-semibold text-white/90">{act.actor}</span>
                    {' '}{tr ? act.action.tr : act.action.en}{' '}
                    <span className="text-brand-accent font-medium">{act.target}</span>
                  </p>
                  <p className="text-[10px] text-white/25 mt-1.5 flex items-center gap-1.5">
                    <Clock size={9} />
                    {tr ? act.time.tr : act.time.en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
