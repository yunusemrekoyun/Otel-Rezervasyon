'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogIn, LogOut as LogOutIcon, Clock, BedDouble, Bell } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TodayData {
  arrivals: Array<{ status: string }>;
  departures: unknown[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PersonelDashboard({ tr: isTr }: { tr: boolean }) {
  const [arrivalsCount, setArrivalsCount] = useState(0);
  const [departuresCount, setDeparturesCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, allRes, contactRes] = await Promise.all([
        fetch('/api/checkin?today=true').then(r => r.json()),
        fetch('/api/reservations').then(r => r.json()),
        fetch('/api/contact').then(r => r.json()),
      ]);

      if (todayRes.ok) {
        const d = todayRes as { ok: true; arrivals: TodayData['arrivals']; departures: TodayData['departures'] };
        setArrivalsCount(d.arrivals.length);
        setDeparturesCount(d.departures.length);
        setPendingCount(d.arrivals.filter(r => r.status === 'pending').length);
      }
      if (allRes.ok) {
        setCheckedInCount(
          (allRes.reservations as Array<{ status: string }>).filter(r => r.status === 'checked_in').length,
        );
      }
      if (contactRes.ok) {
        setContactCount((contactRes.requests as unknown[]).length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const timeStr = time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const secStr = time.toLocaleTimeString('tr-TR', { second: '2-digit' }).replace(/^.*:/, '');
  const dateStr = time.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const stats = [
    {
      label: isTr ? 'Otelde Misafir' : 'Guests In Hotel',
      value: checkedInCount,
      cls: 'text-sky-400',
      bg: 'bg-sky-400/5 border-sky-400/12',
    },
    {
      label: isTr ? 'Bugün Gelen' : 'Arrivals Today',
      value: arrivalsCount,
      cls: 'text-emerald-400',
      bg: 'bg-emerald-400/5 border-emerald-400/12',
    },
    {
      label: isTr ? 'Bugün Giden' : 'Departures Today',
      value: departuresCount,
      cls: 'text-brand-accent',
      bg: 'bg-brand-accent/5 border-brand-accent/12',
    },
    {
      label: isTr ? 'Onay Bekliyor' : 'Pending Approval',
      value: pendingCount,
      cls: 'text-amber-400',
      bg: 'bg-amber-400/5 border-amber-400/12',
    },
    {
      label: isTr ? 'Müşteri Talebi' : 'Guest Requests',
      value: contactCount,
      cls: 'text-purple-400',
      bg: 'bg-purple-400/5 border-purple-400/12',
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-white/90 leading-none">
            {isTr ? 'Günlük Özet' : 'Daily Summary'}
          </h2>
          <p className="text-[11px] text-white/25 mt-0.5 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-xl font-black text-brand-accent leading-none tabular-nums">{timeStr}</p>
            <p className="font-mono text-xs text-white/20 tabular-nums">:{secStr}</p>
          </div>
          <button
            onClick={fetchData}
            className="w-9 h-9 rounded-xl border border-white/8 hover:bg-white/5 flex items-center justify-center text-white/25 hover:text-white transition-colors"
            title={isTr ? 'Yenile' : 'Refresh'}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-brand-accent' : ''} />
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border px-3 py-3 ${s.bg}`}>
            <p className={`text-2xl font-black tabular-nums leading-none ${s.cls}`}>
              {loading ? '—' : s.value}
            </p>
            <p className="text-[10px] text-white/28 mt-1.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Shift info */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-4">
          <p className="text-[10px] text-white/22 uppercase tracking-widest mb-4">
            {isTr ? 'Vardiya Bilgisi' : 'Shift Info'}
          </p>
          <div className="space-y-3">
            {[
              { Icon: LogIn,       label: isTr ? 'Check-in saati'  : 'Check-in time',   value: '14:00' },
              { Icon: LogOutIcon, label: isTr ? 'Check-out saati' : 'Check-out time',  value: '12:00' },
              { Icon: Clock,      label: isTr ? 'Bugünün tarihi'  : 'Today\'s date',    value: time.toLocaleDateString(isTr ? 'tr-TR' : 'en-US') },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white/30">
                  <Icon size={12} />
                  <span className="text-xs">{label}</span>
                </div>
                <span className="text-xs font-bold text-white/65 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Occupancy summary */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-4">
          <p className="text-[10px] text-white/22 uppercase tracking-widest mb-4">
            {isTr ? 'Doluluk Durumu' : 'Occupancy Status'}
          </p>
          <div className="space-y-2.5">
            {[
              { dot: 'bg-sky-400',       label: isTr ? 'Konaklayan misafir'   : 'Guests staying',        value: checkedInCount },
              { dot: 'bg-emerald-400',   label: isTr ? 'Bugün giriş yapacak'  : 'Arriving today',        value: arrivalsCount },
              { dot: 'bg-brand-accent',  label: isTr ? 'Bugün çıkış yapacak'  : 'Departing today',       value: departuresCount },
              { dot: 'bg-amber-400',     label: isTr ? 'Onay bekleyen giriş'  : 'Pending arrivals',      value: pendingCount },
              { dot: 'bg-purple-400',    label: isTr ? 'Müşteri talepleri'    : 'Customer requests',     value: contactCount },
            ].map(({ dot, label, value }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                <span className="text-xs text-white/38 flex-1">{label}</span>
                <span className="text-xs font-bold text-white/65 tabular-nums">{loading ? '—' : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick guide ── */}
      <div className="bg-white/[0.015] border border-white/6 rounded-2xl p-5">
        <p className="text-[10px] text-white/22 uppercase tracking-widest mb-4">
          {isTr ? 'Hızlı Kılavuz' : 'Quick Guide'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              Icon: LogIn,
              title: isTr ? 'Giriş / Çıkış'     : 'Check-in / Out',
              desc:  isTr ? 'QR okutun veya rezervasyon kodunu girin' : 'Scan QR or enter reservation code',
              cls: 'text-emerald-400',
              bg: 'bg-emerald-400/6 border-emerald-400/12',
            },
            {
              Icon: BedDouble,
              title: isTr ? 'Aktif Misafirler'   : 'Active Guests',
              desc:  isTr ? 'Oteldeki tüm misafirleri görüntüleyin'  : 'View all currently staying guests',
              cls: 'text-sky-400',
              bg: 'bg-sky-400/6 border-sky-400/12',
            },
            {
              Icon: Bell,
              title: isTr ? 'Müşteri Talepleri'  : 'Guest Requests',
              desc:  isTr ? 'Misafir istek ve taleplerini yönetin'   : 'Manage guest service requests',
              cls: 'text-purple-400',
              bg: 'bg-purple-400/6 border-purple-400/12',
            },
          ].map(({ Icon, title, desc, cls, bg }) => (
            <div key={title} className={`rounded-xl border p-3.5 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className={cls} />
                <p className={`text-xs font-bold ${cls}`}>{title}</p>
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
