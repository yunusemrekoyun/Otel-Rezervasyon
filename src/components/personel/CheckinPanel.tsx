"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogIn,
  LogOut as LogOutIcon,
  BedDouble,
  User,
  X,
  AlertCircle,
  RefreshCw,
  QrCode,
  CheckCircle2,
  Camera,
  Hash,
  Users,
  DoorOpen,
  ArrowRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResRoom {
  id: string;
  name: string;
  floor: number | null;
  roomType: { name: string };
}

interface Res {
  id: string;
  confirmationId: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string | null;
  room: ResRoom;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_MAP: Record<string, { tr: string; en: string; cls: string }> = {
  pending: {
    tr: "Bekliyor",
    en: "Pending",
    cls: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  confirmed: {
    tr: "Onaylı",
    en: "Confirmed",
    cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  checked_in: {
    tr: "Odada",
    en: "In Room",
    cls: "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
  },
  checked_out: {
    tr: "Ayrıldı",
    en: "Checked Out",
    cls: "text-white/30 bg-white/5 border-white/8",
  },
  cancelled: {
    tr: "İptal",
    en: "Cancelled",
    cls: "text-red-400 bg-red-400/10 border-red-400/20",
  },
};

function StatusBadge({ status, isTr }: { status: string; isTr: boolean }) {
  const s = STATUS_MAP[status] ?? {
    tr: status,
    en: status,
    cls: "text-white/30 bg-white/5 border-white/8",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 ${s.cls}`}
    >
      {isTr ? s.tr : s.en}
    </span>
  );
}

// ── QR Scanner Modal ──────────────────────────────────────────────────────────

function QRScannerModal({
  onCode,
  onClose,
  isTr,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
  isTr: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(true);
  const [camError, setCamError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame = 0;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scan();
      } catch {
        setCamError(
          isTr ? "Kameraya erişim sağlanamadı." : "Camera access denied.",
        );
      }
    }

    async function scan() {
      if (!("BarcodeDetector" in window)) {
        setCamError(
          isTr
            ? "Tarayıcınız kamera ile QR taramayı desteklemiyor.\nFiziksel QR okuyucu kullanın."
            : "Browser QR scanning unsupported.\nUse a physical QR scanner.",
        );
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });

      async function detect() {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const results: Array<{ rawValue: string }> = await detector.detect(
            videoRef.current,
          );
          if (results.length > 0) {
            const val = results[0].rawValue;
            if (/^\d{8}$/.test(val)) {
              onCode(val);
              return;
            }
          }
        } catch {
          /* ignore */
        }
        animFrame = requestAnimationFrame(detect);
      }
      detect();
    }

    start();
    return () => {
      scanningRef.current = false;
      cancelAnimationFrame(animFrame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isTr, onCode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <QrCode size={14} className="text-brand-accent" />
            <p className="text-sm font-semibold text-white/90">
              {isTr ? "QR Kod Tara" : "Scan QR Code"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: "1" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {!camError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/35" />
              <div className="relative w-52 h-52 z-10">
                {(["tl", "tr", "bl", "br"] as const).map((c) => (
                  <div
                    key={c}
                    className={`absolute w-9 h-9 border-brand-accent ${
                      c === "tl"
                        ? "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl"
                        : c === "tr"
                          ? "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl"
                          : c === "bl"
                            ? "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl"
                            : "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl"
                    }`}
                  />
                ))}
                <motion.div
                  className="absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-brand-accent to-transparent"
                  animate={{ top: ["12%", "88%", "12%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          )}

          {camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6">
              <Camera size={36} className="text-white/15" />
              <p className="text-white/40 text-sm text-center whitespace-pre-line">
                {camError}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 text-center border-t border-white/8">
          <p className="text-xs text-white/25">
            {isTr
              ? "Misafirin telefonundaki QR kodu kameranıza gösterin"
              : "Point camera at guest's QR code"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail Card (after search or row click) ───────────────────────────────────

function DetailCard({
  res,
  onClose,
  onAction,
  loading,
  isTr,
  successId,
}: {
  res: Res;
  onClose: () => void;
  onAction: (id: string, action: "checkin" | "checkout") => void;
  loading: boolean;
  isTr: boolean;
  successId: string | null;
}) {
  const canCheckin = ["pending", "confirmed"].includes(res.status);
  const canCheckout = res.status === "checked_in";
  const isSuccess = successId === res.confirmationId;

  const accentColor = canCheckin
    ? "rgba(52,211,153,0.2)"
    : canCheckout
      ? "rgba(var(--app-accent-rgb,255,183,128),0.2)"
      : "rgba(255,255,255,0.06)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: canCheckin
          ? "rgba(52,211,153,0.22)"
          : canCheckout
            ? "rgba(255,183,128,0.22)"
            : "rgba(255,255,255,0.08)",
      }}
    >
      {/* Top accent stripe */}
      <div
        className="h-[3px]"
        style={{
          background: canCheckin
            ? "linear-gradient(90deg,#34d399 0%,transparent 70%)"
            : canCheckout
              ? "linear-gradient(90deg,var(--app-accent,#ffb780) 0%,transparent 70%)"
              : "none",
        }}
      />

      <div className="p-5 space-y-4" style={{ background: accentColor }}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1.5">
              {isTr ? "Rezervasyon" : "Reservation"}
            </p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-2xl font-black text-white tracking-[0.15em]">
                {res.confirmationId}
              </span>
              <StatusBadge status={res.status} isTr={isTr} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/25 hover:text-white transition-colors shrink-0 mt-1"
          >
            <X size={13} />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: isTr ? "Oda" : "Room",
              value: res.room.name,
              sub: `${res.room.roomType.name}${res.room.floor ? ` · Kat ${res.room.floor}` : ""}`,
            },
            {
              label: isTr ? "Misafir" : "Guest",
              value: `${res.firstName} ${res.lastName}`,
              sub: res.phone,
            },
            {
              label: isTr ? "Giriş" : "Check-in",
              value: fmtDate(res.checkInDate),
              sub: "",
            },
            {
              label: isTr ? "Çıkış / Gece" : "Check-out / Nights",
              value: fmtDate(res.checkOutDate),
              sub: `${res.nights} ${isTr ? "gece" : "nights"} · ${res.adultsCount}${isTr ? "y" : "a"}${res.childrenCount > 0 ? `+${res.childrenCount}` : ""}`,
            },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white/3 rounded-xl p-3 min-w-0">
              <p className="text-[9px] text-white/22 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-sm font-bold text-white leading-snug truncate">
                {value}
              </p>
              {sub && (
                <p className="text-[10px] text-white/30 truncate">{sub}</p>
              )}
            </div>
          ))}
        </div>

        {res.specialRequests && (
          <div className="px-3 py-2 bg-amber-400/5 border border-amber-400/12 rounded-xl text-xs text-amber-400/65 italic leading-relaxed">
            {res.specialRequests}
          </div>
        )}

        {/* Action */}
        {isSuccess ? (
          <div className="flex items-center justify-center gap-2 py-2.5 text-emerald-400 text-sm font-bold">
            <CheckCircle2 size={16} />
            {isTr ? "İşlem başarıyla tamamlandı!" : "Completed successfully!"}
          </div>
        ) : (
          <div className="flex gap-2">
            {canCheckin && (
              <button
                onClick={() => onAction(res.confirmationId, "checkin")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/18 border border-emerald-500/22 text-emerald-400 text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                <LogIn size={14} />
                {isTr ? "Check-in Yap" : "Check In"}
              </button>
            )}
            {canCheckout && (
              <button
                onClick={() => onAction(res.confirmationId, "checkout")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-accent/10 hover:bg-brand-accent/18 border border-brand-accent/22 text-brand-accent text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                <LogOutIcon size={14} />
                {isTr ? "Check-out Yap" : "Check Out"}
              </button>
            )}
            {!canCheckin && !canCheckout && (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white/20 text-xs">
                <AlertCircle size={12} />
                {isTr
                  ? "Bu rezervasyon için işlem yapılamaz."
                  : "No action available."}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Guest Row ─────────────────────────────────────────────────────────────────

function GuestRow({
  res,
  isArrival,
  onAction,
  loading,
  isTr,
  successId,
  isSelected,
  onSelect,
}: {
  res: Res;
  isArrival: boolean;
  onAction: (id: string, action: "checkin" | "checkout") => void;
  loading: boolean;
  isTr: boolean;
  successId: string | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isSuccess = successId === res.confirmationId;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? "bg-white/5 border-white/10"
          : "border-transparent hover:bg-white/3 hover:border-white/6"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
          isArrival
            ? "bg-emerald-500/8 border-emerald-500/15"
            : "bg-brand-accent/8 border-brand-accent/15"
        }`}
      >
        <BedDouble
          size={13}
          className={isArrival ? "text-emerald-400" : "text-brand-accent"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-white/90 truncate">
            {res.room.name}
          </p>
          <StatusBadge status={res.status} isTr={isTr} />
        </div>
        <p className="text-xs text-white/35 truncate mt-0.5">
          {res.firstName} {res.lastName}
          <span className="mx-1 text-white/15">·</span>
          <span className="font-mono">{res.confirmationId}</span>
          {res.specialRequests && (
            <span className="ml-1.5 text-amber-400/50">★</span>
          )}
        </p>
      </div>

      {isSuccess ? (
        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction(res.confirmationId, isArrival ? "checkin" : "checkout");
          }}
          disabled={loading}
          className={`shrink-0 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors disabled:opacity-40 ${
            isArrival
              ? "bg-emerald-500/8 hover:bg-emerald-500/18 border-emerald-500/18 text-emerald-400"
              : "bg-brand-accent/8 hover:bg-brand-accent/18 border-brand-accent/18 text-brand-accent"
          }`}
        >
          {isArrival
            ? isTr
              ? "Giriş"
              : "Check in"
            : isTr
              ? "Çıkış"
              : "Check out"}
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CheckinPanel({ tr: isTr }: { tr: boolean }) {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Res | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [listTab, setListTab] = useState<"arrivals" | "departures">("arrivals");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [arrivals, setArrivals] = useState<Res[]>([]);
  const [departures, setDepartures] = useState<Res[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Live clock
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchToday = useCallback(async () => {
    setLoadingToday(true);
    try {
      const res = await fetch("/api/checkin?today=true");
      const data = await res.json();
      if (data.ok) {
        setArrivals(data.arrivals);
        setDepartures(data.departures);
      }
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  // Core search — accepts explicit code so QR scanner can pass directly
  const executeSearch = useCallback(
    async (c: string) => {
      setSearching(true);
      setSearchError(null);
      setFound(null);
      setSelectedId(null);
      try {
        const res = await fetch(`/api/checkin?code=${encodeURIComponent(c)}`);
        const data = await res.json();
        if (data.ok) {
          setFound(data.reservation);
        } else {
          setSearchError(
            data.message ?? (isTr ? "Rezervasyon bulunamadı." : "Not found."),
          );
        }
      } catch {
        setSearchError(isTr ? "Bağlantı hatası." : "Connection error.");
      } finally {
        setSearching(false);
      }
    },
    [isTr],
  );

  const handleSearch = useCallback(() => {
    const c = code.trim();
    if (c) executeSearch(c);
  }, [code, executeSearch]);

  const handleQRCode = useCallback(
    (qrCode: string) => {
      setShowQR(false);
      setCode(qrCode);
      executeSearch(qrCode);
    },
    [executeSearch],
  );

  const handleAction = useCallback(
    async (confirmationId: string, action: "checkin" | "checkout") => {
      setActionLoading(true);
      try {
        const res = await fetch("/api/checkin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmationId, action }),
        });
        const data = await res.json();
        if (data.ok) {
          setSuccessId(confirmationId);
          if (found?.confirmationId === confirmationId)
            setFound(data.reservation);
          await fetchToday();
          setTimeout(() => {
            setSuccessId(null);
            if (found?.confirmationId === confirmationId) {
              setFound(null);
              setCode("");
              setSelectedId(null);
              inputRef.current?.focus();
            }
          }, 2500);
        } else {
          alert(data.message ?? (isTr ? "Hata oluştu." : "An error occurred."));
        }
      } catch {
        alert(isTr ? "Bağlantı hatası." : "Connection error.");
      } finally {
        setActionLoading(false);
      }
    },
    [found, fetchToday, isTr],
  );

  const timeStr = time.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const secStr = time
    .toLocaleTimeString("tr-TR", { second: "2-digit" })
    .replace(/^.*:/, "");
  const dateStr = time.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const listItems = listTab === "arrivals" ? arrivals : departures;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
            <DoorOpen size={18} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white/90 leading-none">
              {isTr
                ? "Giriş / Çıkış Terminali"
                : "Check-in / Check-out Terminal"}
            </h2>
            <p className="text-[11px] text-white/25 mt-0.5 capitalize">
              {dateStr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-xl font-black text-brand-accent leading-none tabular-nums">
              {timeStr}
            </p>
            <p className="font-mono text-xs text-white/20 tabular-nums">
              :{secStr}
            </p>
          </div>
          <button
            onClick={fetchToday}
            className="w-9 h-9 rounded-xl border border-white/8 hover:bg-white/5 flex items-center justify-center text-white/25 hover:text-white transition-colors"
            title={isTr ? "Yenile" : "Refresh"}
          >
            <RefreshCw
              size={13}
              className={loadingToday ? "animate-spin text-brand-accent" : ""}
            />
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            label: isTr ? "Bugün Beklenen" : "Expected Today",
            value: arrivals.length,
            cls: "text-emerald-400",
            bg: "bg-emerald-400/5 border-emerald-400/12",
          },
          {
            label: isTr ? "Onay Bekliyor" : "Pending",
            value: arrivals.filter((r) => r.status === "pending").length,
            cls: "text-amber-400",
            bg: "bg-amber-400/5 border-amber-400/12",
          },
          {
            label: isTr ? "Bugün Çıkış" : "Departures Today",
            value: departures.length,
            cls: "text-brand-accent",
            bg: "bg-brand-accent/5 border-brand-accent/12",
          },
          {
            label: isTr ? "Onaylı Giriş" : "Confirmed Arrivals",
            value: arrivals.filter((r) => r.status === "confirmed").length,
            cls: "text-sky-400",
            bg: "bg-sky-400/5 border-sky-400/12",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-3 py-2.5 ${s.bg}`}>
            <p className={`text-xl font-black tabular-nums ${s.cls}`}>
              {s.value}
            </p>
            <p className="text-[10px] text-white/28 mt-0.5 leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* ══ LEFT: input station ══ */}
        <div className="lg:col-span-2 space-y-3">
          {/* Code input card */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Hash size={12} className="text-brand-accent" />
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                {isTr ? "Rezervasyon Kodu Gir" : "Enter Reservation Code"}
              </p>
            </div>

            {/* Big code input */}
            <div className="relative">
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 8));
                  setSearchError(null);
                  if (found) {
                    setFound(null);
                    setSelectedId(null);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="00000000"
                className="w-full bg-white/4 border border-white/8 rounded-xl px-5 py-5 font-mono text-[2.2rem] font-black text-white text-center tracking-[0.3em] placeholder-white/8 focus:outline-none focus:border-brand-accent/35 transition-colors"
                maxLength={8}
                inputMode="numeric"
              />
              {code.length > 0 && (
                <button
                  onClick={() => {
                    setCode("");
                    setFound(null);
                    setSearchError(null);
                    setSelectedId(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/15 hover:text-white/50 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-150 ${
                    i < code.length
                      ? "w-4 h-1.5 bg-brand-accent"
                      : "w-1.5 h-1.5 bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={searching || code.length !== 8}
              className="w-full py-3.5 rounded-xl bg-brand-accent text-black font-black text-sm tracking-wide disabled:opacity-25 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {searching ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <ArrowRight size={14} />
                  {isTr ? "Rezervasyonu Getir" : "Find Reservation"}
                </>
              )}
            </button>

            {/* Error */}
            <AnimatePresence>
              {searchError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-xs"
                >
                  <AlertCircle size={12} className="shrink-0" />
                  {searchError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* QR scan button */}
          <button
            onClick={() => setShowQR(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/12 text-white/40 hover:text-white text-sm font-semibold transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center shrink-0 group-hover:bg-brand-accent/10 group-hover:border-brand-accent/20 transition-colors">
              <Camera
                size={14}
                className="group-hover:text-brand-accent transition-colors"
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                {isTr ? "Kamera ile QR Tara" : "Scan QR via Camera"}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">
                {isTr
                  ? "Misafirin telefonunu kameraya gösterin"
                  : "Point camera at guest's phone"}
              </p>
            </div>
            <QrCode
              size={15}
              className="text-white/15 group-hover:text-brand-accent/50 transition-colors shrink-0"
            />
          </button>

          {/* Detail card */}
          <AnimatePresence mode="wait">
            {found && (
              <DetailCard
                key={found.id}
                res={found}
                onClose={() => {
                  setFound(null);
                  setCode("");
                  setSelectedId(null);
                  inputRef.current?.focus();
                }}
                onAction={handleAction}
                loading={actionLoading}
                isTr={isTr}
                successId={successId}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ══ RIGHT: today's list ══ */}
        <div
          className="lg:col-span-3 bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden flex flex-col"
          style={{ minHeight: 420 }}
        >
          {/* Tab bar */}
          <div className="flex border-b border-white/8 shrink-0">
            {[
              {
                id: "arrivals" as const,
                label: isTr ? "Bugünkü Gelenler" : "Today's Arrivals",
                count: arrivals.length,
                dot: "bg-emerald-400",
              },
              {
                id: "departures" as const,
                label: isTr ? "Bugünkü Gidenler" : "Today's Departures",
                count: departures.length,
                dot: "bg-brand-accent",
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setListTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors ${
                  listTab === t.id
                    ? "border-brand-accent text-white bg-white/2"
                    : "border-transparent text-white/28 hover:text-white/55"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                {t.label}
                <span className="px-1.5 py-0.5 rounded-full bg-white/6 text-white/35 text-[10px] font-mono min-w-[1.5rem] text-center">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingToday ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw size={20} className="animate-spin text-white/15" />
                <p className="text-xs text-white/20">
                  {isTr ? "Yükleniyor…" : "Loading…"}
                </p>
              </div>
            ) : listItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center">
                  {listTab === "arrivals" ? (
                    <Users size={22} className="text-white/12" />
                  ) : (
                    <LogOutIcon size={22} className="text-white/12" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/20">
                    {isTr
                      ? listTab === "arrivals"
                        ? "Bugün beklenen misafir yok"
                        : "Bugün çıkış yapacak misafir yok"
                      : listTab === "arrivals"
                        ? "No arrivals expected today"
                        : "No departures today"}
                  </p>
                  <p className="text-xs text-white/12 mt-1">
                    {isTr
                      ? "Yeni rezervasyonlar burada görünecek"
                      : "New reservations will appear here"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {listItems.map((r) => (
                  <GuestRow
                    key={r.id}
                    res={r}
                    isArrival={listTab === "arrivals"}
                    onAction={handleAction}
                    loading={actionLoading}
                    isTr={isTr}
                    successId={successId}
                    isSelected={selectedId === r.id}
                    onSelect={() => {
                      if (selectedId === r.id) {
                        setSelectedId(null);
                        setFound(null);
                        setCode("");
                      } else {
                        setSelectedId(r.id);
                        setFound(r);
                        setCode(r.confirmationId);
                        setSearchError(null);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR modal */}
      <AnimatePresence>
        {showQR && (
          <QRScannerModal
            onCode={handleQRCode}
            onClose={() => setShowQR(false)}
            isTr={isTr}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
