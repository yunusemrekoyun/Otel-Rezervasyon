'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, BedDouble,
  CheckCircle2, Clock, XCircle, AlertCircle, MapPin,
  QrCode, X, Loader2, Trash2,
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

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QRModal({ code, onClose, tr }: { code: string; onClose: () => void; tr: boolean }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}&bgcolor=ffffff&color=1c1714&qzone=1&margin=0`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl w-72"
      >
        <div className="flex items-center justify-between w-full">
          <p className="text-[#1c1714] text-sm font-semibold">
            {tr ? 'Rezervasyon QR' : 'Reservation QR'}
          </p>
          <button onClick={onClose} className="text-[#1c1714]/40 hover:text-[#1c1714] transition-colors">
            <X size={16} />
          </button>
        </div>
        <img
          src={qrUrl}
          alt={`QR ${code}`}
          width={220}
          height={220}
          className="rounded-xl"
        />
        <div className="text-center">
          <p className="font-mono text-2xl font-bold text-[#1c1714] tracking-[0.2em]">{code}</p>
          <p className="text-[11px] text-[#1c1714]/40 mt-1">
            {tr ? 'Bu kodu resepsiyonda gösterin' : 'Show this code at reception'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reservation Card ───────────────────────────────────────────────────────────

function ReservationCard({ res, tr, onCancel }: { res: Reservation; tr: boolean; onCancel: (id: string) => void }) {
  const [showQR, setShowQR] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const badge = statusBadge(res.status, tr);
  const BadgeIcon = badge.icon;
  const now = new Date();
  const checkIn = new Date(res.checkInDate.slice(0, 10) + 'T12:00:00');
  const isUpcoming = checkIn > now && res.status !== 'cancelled';
  const daysLeft = Math.ceil((checkIn.getTime() - now.getTime()) / 86400000);
  const canCancel = isUpcoming && ['pending', 'confirmed'].includes(res.status);

  async function handleCancel() {
    setCancelling(true);
    const r = await fetch(`/api/reservations/${res.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    }).catch(() => null);
    const data = r ? await r.json().catch(() => null) : null;
    setCancelling(false);
    if (data?.ok) {
      onCancel(res.id);
    }
    setConfirmCancel(false);
  }

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
          <p className="text-xs font-mono text-brand-accent/80 tracking-widest">{res.confirmationId}</p>
        </div>
        <div className="flex items-center gap-3">
          {res.status !== 'cancelled' && (
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-white/40 hover:text-white/70 text-[10px] font-medium transition-colors"
            >
              <QrCode size={11} />
              QR
            </button>
          )}
          <div className="text-right">
            <p className="text-[10px] text-white/25">{tr ? 'Toplam' : 'Total'}</p>
            <p className="text-sm font-bold text-brand-accent">₺{res.totalPrice.toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>

      {isUpcoming && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
          <p className="text-[10px] text-brand-accent/60">
            {tr ? `Check-in'e ${daysLeft} gün kaldı` : `${daysLeft} days until check-in`}
          </p>
          {canCancel && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-400/8 border border-transparent hover:border-red-400/15 transition-colors"
            >
              <Trash2 size={10} />
              {tr ? 'İptal Et' : 'Cancel'}
            </button>
          )}
        </div>
      )}

      {confirmCancel && (
        <div className="mt-2 pt-2 border-t border-red-400/15 flex items-center justify-between gap-2">
          <p className="text-[10px] text-red-400/80">
            {tr ? 'Rezervasyonu iptal etmek istediğinize emin misiniz?' : 'Are you sure you want to cancel this reservation?'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setConfirmCancel(false)}
              className="px-2.5 py-1 rounded-lg text-[10px] text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              {tr ? 'Hayır' : 'No'}
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-2.5 py-1 rounded-lg text-[10px] text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {cancelling && <Loader2 size={9} className="animate-spin" />}
              {tr ? 'İptal Et' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showQR && <QRModal code={res.confirmationId} onClose={() => setShowQR(false)} tr={tr} />}
      </AnimatePresence>
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

  function handleCancel(id: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
  }

  const now = new Date();

  const filtered = reservations.filter(r => {
    const checkOut = new Date(r.checkOutDate.slice(0, 10) + 'T12:00:00');
    const checkIn  = new Date(r.checkInDate.slice(0, 10)  + 'T12:00:00');
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
              <ReservationCard key={r.id} res={r} tr={tr} onCancel={handleCancel} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
