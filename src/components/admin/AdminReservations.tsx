'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, ChevronLeft, ChevronRight, BedDouble,
  CheckCircle2, Clock, XCircle, AlertCircle, MapPin, Users,
} from 'lucide-react';
import {
  MONTHS_TR, MONTHS_EN,
  startOfDay, addMonths, daysInMonth, firstDayOfMonth,
} from '@/components/ui/CalendarPicker';
import { useTheme } from '@/theme/ThemeContext';

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
  firstName: string;
  lastName: string;
  email: string;
  room: { id: string; name: string; roomType: { name: string } };
}

interface AvailRange {
  checkIn: string;
  checkOut: string;
  roomId: string;
  roomName: string;
}

interface RoomInfo {
  id: string;
  name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Returns map of dateStr → Map<roomId, roomName> for booked rooms
function buildOccupancyMap(ranges: AvailRange[], year: number, month: number): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  const days = daysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    const s = dateStr(year, month, d);
    const booked = new Map<string, string>();
    ranges.filter(r => r.checkIn <= s && r.checkOut > s).forEach(r => booked.set(r.roomId, r.roomName));
    if (booked.size > 0) map.set(s, booked);
  }
  return map;
}

// ── Occupancy Tooltip ──────────────────────────────────────────────────────────

interface TooltipState {
  day: string;
  rect: DOMRect;
  bookedRooms: RoomInfo[];
  availRooms: RoomInfo[];
}

function OccupancyTooltip({ info, tr }: { info: TooltipState; tr: boolean }) {
  const { mode } = useTheme();
  const label = new Date(info.day + 'T12:00:00').toLocaleDateString(tr ? 'tr-TR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Position: above cell, centered horizontally
  const top  = info.rect.top + window.scrollY - 8;
  const left = info.rect.left + window.scrollX + info.rect.width / 2;

  return createPortal(
    <div
      data-mode={mode}
      className="pointer-events-none fixed z-[9999]"
      style={{ top, left, transform: 'translate(-50%, -100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.97 }}
        transition={{ duration: 0.12 }}
        className="modal-shell p-3 min-w-[180px] max-w-[240px]"
      >
        <p className="text-[11px] font-semibold text-main mb-2.5 border-b border-m-border pb-2">{label}</p>

        {info.bookedRooms.length > 0 && (
          <div className="mb-2">
            <p className="text-[9px] text-subtle uppercase tracking-wider mb-1.5">
              {tr ? `Dolu — ${info.bookedRooms.length} oda` : `Booked — ${info.bookedRooms.length} room${info.bookedRooms.length > 1 ? 's' : ''}`}
            </p>
            <div className="space-y-1">
              {info.bookedRooms.map(r => (
                <div key={r.id} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-[10px] text-red-300 font-medium">{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {info.availRooms.length > 0 && (
          <div>
            <p className="text-[9px] text-subtle uppercase tracking-wider mb-1.5">
              {tr ? `Müsait — ${info.availRooms.length} oda` : `Available — ${info.availRooms.length} room${info.availRooms.length > 1 ? 's' : ''}`}
            </p>
            <div className="space-y-1">
              {info.availRooms.map(r => (
                <div key={r.id} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] text-emerald-400 font-medium">{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arrow */}
        <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b border-m-border" style={{ background: 'var(--m-modal)' }} />
      </motion.div>
    </div>,
    document.body,
  );
}

function statusBadge(status: string, tr: boolean) {
  switch (status) {
    case 'confirmed':  return { label: tr ? 'Onaylı'         : 'Confirmed',   icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    case 'pending':    return { label: tr ? 'Bekliyor'       : 'Pending',     icon: Clock,        cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    case 'payment_pending': return { label: tr ? 'Ödeme Bekliyor' : 'Payment Pending', icon: Clock, cls: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
    case 'cancelled':  return { label: tr ? 'İptal'          : 'Cancelled',   icon: XCircle,      cls: 'text-red-400 bg-red-400/10 border-red-400/20' };
    case 'checked_in': return { label: tr ? 'Check-in'       : 'Checked In',  icon: MapPin,       cls: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20' };
    case 'checked_out':return { label: tr ? 'Ayrıldı'        : 'Checked Out', icon: CheckCircle2, cls: 'text-muted bg-m-surface2 border-m-border' };
    default:           return { label: status,                                   icon: AlertCircle,  cls: 'text-muted bg-m-surface2 border-m-border' };
  }
}

function fmtDate(iso: string, tr: boolean) {
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(tr ? 'tr-TR' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Occupancy Calendar ─────────────────────────────────────────────────────────

const DAY_LABELS_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const DAY_LABELS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function cellStyle(booked: number, total: number): { bg: string; text: string; bar: string } {
  if (total === 0 || booked === 0) return { bg: '', text: 'text-muted', bar: '' };
  const pct = booked / total;
  if (pct < 0.5)  return { bg: 'bg-amber-500/12',  text: 'text-amber-300',  bar: 'bg-amber-400' };
  if (pct < 1)    return { bg: 'bg-orange-500/20', text: 'text-orange-300', bar: 'bg-orange-500' };
  return            { bg: 'bg-red-500/25',    text: 'text-red-300',    bar: 'bg-red-500'   };
}

function AvailabilityCalendar({ tr }: { tr: boolean }) {
  const today = startOfDay(new Date());
  const [current, setCurrent]     = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [ranges, setRanges]       = useState<AvailRange[]>([]);
  const [allRooms, setAllRooms]   = useState<RoomInfo[]>([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [tooltip, setTooltip]     = useState<TooltipState | null>(null);
  const [mounted, setMounted]     = useState(false);
  useEffect(() => setMounted(true), []);

  const year      = current.getFullYear();
  const month     = current.getMonth();
  const days      = daysInMonth(year, month);
  const firstDay  = firstDayOfMonth(year, month);
  const monthNames = tr ? MONTHS_TR : MONTHS_EN;
  const dayLabels  = tr ? DAY_LABELS_TR : DAY_LABELS_EN;

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/availability?year=${y}&month=${m}`);
      const data = await res.json();
      if (data.ok) {
        setRanges(data.ranges);
        setAllRooms(data.allRooms ?? []);
        setTotalRooms(data.totalRooms ?? 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(year, month); }, [year, month, fetchData]);

  const occupancyMap = buildOccupancyMap(ranges, year, month);

  // Summary stats
  const daysFullyBooked = [...occupancyMap.values()].filter(m => m.size >= totalRooms && totalRooms > 0).length;
  const avgOccupancy    = totalRooms > 0
    ? Math.round([...occupancyMap.values()].reduce((sum, m) => sum + m.size, 0) / (days * totalRooms) * 100)
    : 0;

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>, s: string, bookedMap: Map<string, string>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const bookedRooms = [...bookedMap.entries()].map(([id, name]) => ({ id, name }));
    const bookedIds   = new Set(bookedMap.keys());
    const availRooms  = allRooms.filter(r => !bookedIds.has(r.id));
    setTooltip({ day: s, rect, bookedRooms, availRooms });
  }

  return (
    <div className="surface-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-main">
            {tr ? 'Doluluk Takvimi' : 'Occupancy Calendar'}
          </h3>
          <p className="text-[10px] text-subtle mt-0.5">
            {tr
              ? `Ortalama doluluk %${avgOccupancy} · ${daysFullyBooked} gün tam dolu · Toplam ${totalRooms} oda`
              : `Avg occupancy ${avgOccupancy}% · ${daysFullyBooked} fully booked days · ${totalRooms} rooms`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrent(m => addMonths(m, -1)); setTooltip(null); }}
            className="w-7 h-7 rounded-lg surface-soft hover:bg-m-hover flex items-center justify-center text-muted hover:text-main transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-muted min-w-[110px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => { setCurrent(m => addMonths(m, 1)); setTooltip(null); }}
            className="w-7 h-7 rounded-lg surface-soft hover:bg-m-hover flex items-center justify-center text-muted hover:text-main transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-subtle text-xs">
          {tr ? 'Yükleniyor…' : 'Loading…'}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setTooltip(null)}>
          {/* Day headers */}
          {dayLabels.map(d => (
          <div key={d} className="text-[10px] text-subtle font-medium text-center py-1">{d}</div>
          ))}

          {/* Empty leading cells */}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

          {/* Day cells */}
          {Array.from({ length: days }).map((_, i) => {
            const day      = i + 1;
            const s        = dateStr(year, month, day);
            const bookedMap = occupancyMap.get(s) ?? new Map<string, string>();
            const booked   = bookedMap.size;
            const isToday  = s === dateStr(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast   = s < dateStr(today.getFullYear(), today.getMonth(), today.getDate());
            const style    = cellStyle(booked, totalRooms);
            const pct      = totalRooms > 0 ? Math.round((booked / totalRooms) * 100) : 0;

            return (
              <div
                key={day}
                className={`
                  relative flex flex-col items-center justify-center rounded-lg py-1.5 px-0.5
                  transition-colors select-none cursor-default
                  ${style.bg}
                  ${isPast ? 'opacity-45' : booked > 0 ? 'hover:brightness-110' : 'hover:bg-m-hover'}
                `}
                onMouseEnter={booked > 0 ? e => handleMouseEnter(e, s, bookedMap) : undefined}
              >
                <span className={`text-xs font-medium leading-none ${
                  isToday ? 'text-brand-accent font-bold' : booked > 0 ? style.text : 'text-muted'
                }`}>
                  {day}
                </span>

                {booked > 0 && (
                  <span className={`text-[8px] leading-none mt-0.5 font-semibold ${style.text} opacity-80`}>
                    {booked}/{totalRooms}
                  </span>
                )}

                {booked > 0 && totalRooms > 0 && (
                  <div className="absolute bottom-0.5 left-1 right-1 h-[2px] rounded-full bg-m-surface2">
                    <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                )}

                {isToday && booked === 0 && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-accent" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-m-border flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-m-surface2 border border-m-border" />
          <span className="text-[10px] text-subtle">{tr ? 'Müsait' : 'Available'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-400/20" />
          <span className="text-[10px] text-subtle">{tr ? 'Kısmen dolu (&lt;50%)' : 'Partial (&lt;50%)'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-500/25 border border-orange-500/20" />
          <span className="text-[10px] text-subtle">{tr ? 'Yoğun (50–99%)' : 'Busy (50–99%)'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/20" />
          <span className="text-[10px] text-subtle">{tr ? 'Tam dolu' : 'Fully booked'}</span>
        </div>
        <span className="text-[10px] text-faint ml-auto">{tr ? 'Dolu günlerin üzerine gelin' : 'Hover over busy days'}</span>
      </div>

      {/* Tooltip portal */}
      <AnimatePresence>
        {mounted && tooltip && <OccupancyTooltip info={tooltip} tr={tr} />}
      </AnimatePresence>
    </div>
  );
}

// ── Reservation Row ────────────────────────────────────────────────────────────

function ReservationRow({ res, tr }: { res: Reservation; tr: boolean }) {
  const badge = statusBadge(res.status, tr);
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 surface-card hover:bg-m-hover transition-colors"
    >
      {/* Guest + room */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-main truncate">
            {res.firstName} {res.lastName}
          </p>
          <span className="text-[10px] text-subtle truncate hidden sm:block">{res.email}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <BedDouble size={10} className="text-subtle shrink-0" />
          <span className="text-[11px] text-muted truncate">{res.room.name} · {res.room.roomType.name}</span>
          <span className="text-[11px] text-subtle shrink-0">
            · {res.adultsCount}<Users size={9} className="inline ml-0.5" />
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="text-right shrink-0 hidden md:block">
        <p className="text-[11px] text-muted">{fmtDate(res.checkInDate, tr)}</p>
        <p className="text-[10px] text-subtle">{res.nights} {tr ? 'gece' : 'night'}</p>
      </div>

      {/* Price */}
      <p className="text-sm font-semibold text-brand-accent shrink-0">
        ₺{res.totalPrice.toLocaleString('tr-TR')}
      </p>

      {/* Status badge */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0 ${badge.cls}`}>
        <BadgeIcon size={9} />
        <span className="hidden sm:inline">{badge.label}</span>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AdminReservations({ tr }: { tr: boolean }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    fetch('/api/reservations')
      .then(r => r.json())
      .then(data => { if (data.ok) setReservations(data.reservations); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter);

  const filters = [
    { id: 'all'       as const, label: tr ? 'Tümü'     : 'All'       },
    { id: 'pending'   as const, label: tr ? 'Bekleyen' : 'Pending'   },
    { id: 'confirmed' as const, label: tr ? 'Onaylı'   : 'Confirmed' },
    { id: 'cancelled' as const, label: tr ? 'İptal'    : 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Availability calendar */}
      <AvailabilityCalendar tr={tr} />

      {/* All reservations table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-main">
            {tr ? 'Tüm Rezervasyonlar' : 'All Reservations'}
            <span className="ml-2 text-[10px] text-subtle font-normal">({reservations.length})</span>
          </h3>
          <div className="tab-list">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-brand-accent text-black'
                    : 'text-muted hover:text-main'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-subtle text-sm">
            {tr ? 'Yükleniyor…' : 'Loading…'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Calendar size={24} className="text-faint" />
            <p className="text-sm text-subtle">
              {tr ? 'Rezervasyon bulunamadı.' : 'No reservations found.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-1.5">
              {filtered.map(r => (
                <ReservationRow key={r.id} res={r} tr={tr} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
