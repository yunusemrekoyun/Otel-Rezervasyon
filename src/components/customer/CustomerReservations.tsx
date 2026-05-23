'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, BedDouble,
  CheckCircle2, Clock, XCircle, AlertCircle, MapPin,
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Reservation {
  id: string;
  confirmationId: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adultsCount: number;
  childrenCount: number;
  totalPrice: number;
  room: { id: string; name: string; roomType: { name: string } };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusBadge(status: string, tr: boolean) {
  switch (status) {
    case 'confirmed':
      return { label: tr ? 'Onaylı' : 'Confirmed', icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    case 'pending':
      return { label: tr ? 'Bekliyor' : 'Pending', icon: Clock, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    case 'cancelled':
      return { label: tr ? 'İptal Edildi' : 'Cancelled', icon: XCircle, cls: 'text-red-400 bg-red-400/10 border-red-400/20' };
    case 'checked_in':
      return { label: tr ? 'Check-in Yapıldı' : 'Checked In', icon: MapPin, cls: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20' };
    case 'checked_out':
      return { label: tr ? 'Ayrıldı' : 'Checked Out', icon: CheckCircle2, cls: 'text-white/40 bg-white/5 border-white/10' };
    default:
      return { label: status, icon: AlertCircle, cls: 'text-white/40 bg-white/5 border-white/10' };
  }
}

function fmtDate(iso: string, tr: boolean) {
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(tr ? 'tr-TR' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Reservation Card ───────────────────────────────────────────────────────────

function ReservationCard({ res, tr }: { res: Reservation; tr: boolean }) {
  const badge = statusBadge(res.status, tr);
  const BadgeIcon = badge.icon;
  const now = new Date();
  const checkIn = new Date(res.checkInDate + 'T12:00:00');
  const isUpcoming = checkIn > now && res.status !== 'cancelled';
  const daysLeft = Math.ceil((checkIn.getTime() - now.getTime()) / 86400000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/3 border border-white/8 rounded-xl p-4 hover:border-white/12 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/15 flex items-center justify-center shrink-0">
            <BedDouble size={14} className="text-brand-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">{res.room.name}</p>
            <p className="text-[10px] text-white/35 mt-0.5">{res.room.roomType.name}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold shrink-0 ${badge.cls}`}>
          <BadgeIcon size={10} />
          {badge.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/3 rounded-lg p-2">
          <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">
            {tr ? 'Giriş' : 'Check-in'}
          </p>
          <p className="text-white/80 font-medium text-[11px]">{fmtDate(res.checkInDate, tr)}</p>
        </div>
        <div className="bg-white/3 rounded-lg p-2">
          <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">
            {tr ? 'Çıkış' : 'Check-out'}
          </p>
          <p className="text-white/80 font-medium text-[11px]">{fmtDate(res.checkOutDate, tr)}</p>
        </div>
        <div className="bg-white/3 rounded-lg p-2">
          <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">
            {tr ? 'Gece / Kişi' : 'Nights / Guests'}
          </p>
          <p className="text-white/80 font-medium text-[11px]">
            {res.nights}{tr ? 'g' : 'n'} · {res.adultsCount}{tr ? 'y' : 'a'}{res.childrenCount > 0 ? `+${res.childrenCount}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/25">{tr ? 'Onay Kodu' : 'Confirmation'}</p>
          <p className="text-xs font-mono text-brand-accent/80">{res.confirmationId}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/25">{tr ? 'Toplam' : 'Total'}</p>
          <p className="text-sm font-bold text-brand-accent">₺{res.totalPrice.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      {isUpcoming && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[10px] text-brand-accent/60">
            {tr ? `Check-in'e ${daysLeft} gün kaldı` : `${daysLeft} days until check-in`}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CustomerReservations({ user, tr }: { user: AuthUser; tr: boolean }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    fetch('/api/reservations')
      .then(r => r.json())
      .then(data => { if (data.ok) setReservations(data.reservations); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const now = new Date();

  const filtered = reservations.filter(r => {
    const checkOut = new Date(r.checkOutDate + 'T12:00:00');
    const checkIn  = new Date(r.checkInDate  + 'T12:00:00');
    if (tab === 'upcoming') return checkIn >= now && r.status !== 'cancelled';
    if (tab === 'past')     return checkOut < now || r.status === 'cancelled';
    return true;
  });

  const tabs = [
    { id: 'upcoming' as const, label: tr ? 'Yaklaşan' : 'Upcoming' },
    { id: 'past'     as const, label: tr ? 'Geçmiş'   : 'Past'     },
    { id: 'all'      as const, label: tr ? 'Tümü'     : 'All'      },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-white/3 border border-white/8 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-brand-accent text-black'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-white/30 text-sm">
          {tr ? 'Yükleniyor…' : 'Loading…'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/8 flex items-center justify-center">
            <Calendar size={20} className="text-white/20" />
          </div>
          <p className="text-sm text-white/30">
            {tr ? 'Bu kategoride rezervasyon bulunamadı.' : 'No reservations found in this category.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(r => (
              <ReservationCard key={r.id} res={r} tr={tr} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
