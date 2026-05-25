'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Palette, ChevronLeft, ChevronRight, CreditCard, Bell, Server, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useTheme, THEMES } from '@/theme/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type View = 'main' | 'appearance' | 'hotel-hours';

// ── Hotel Hours sub-view ───────────────────────────────────────────────────────

function HotelHoursView({ isTr, onBack }: { isTr: boolean; onBack: () => void }) {
  const [checkInTime,  setCheckInTime]  = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState('');
  const [isError,  setIsError]  = useState(false);

  useEffect(() => {
    fetch('/api/settings/checkin-times')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setCheckInTime(data.checkInTime);
          setCheckOutTime(data.checkOutTime);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings/checkin-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInTime, checkOutTime }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? 'Hata');
      setIsError(false);
      setMessage(isTr ? 'Saatler kaydedildi.' : 'Times saved.');
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : (isTr ? 'Kaydedilemedi.' : 'Could not save.'));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'control-base px-4 py-3 text-sm';

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-subtle hover:text-main transition-colors"
        >
          <ChevronLeft size={14} />
          {isTr ? 'Sistem Ayarları' : 'Settings'}
        </button>
        <span className="text-faint">/</span>
        <span className="text-xs text-muted font-medium">
          {isTr ? 'Otel Saatleri' : 'Hotel Hours'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
          <Clock size={18} className="text-brand-accent" />
        </div>
        <div>
          <h2 className="text-base font-bold text-main leading-none">
            {isTr ? 'Check-in / Check-out Saatleri' : 'Check-in / Check-out Times'}
          </h2>
          <p className="text-[11px] text-subtle mt-0.5">
            {isTr
              ? 'Bu saatler rezervasyon onayında, müşteri panelinde ve personel ekranında gösterilir.'
              : 'These times are shown in booking confirmations, customer portal, and staff screens.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={18} className="animate-spin text-brand-accent/40" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="surface-panel p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] text-subtle uppercase tracking-wider">
                {isTr ? 'Check-in Saati' : 'Check-in Time'}
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={e => setCheckInTime(e.target.value)}
                className={inputCls}
                required
              />
              <p className="text-[10px] text-subtle">
                {isTr ? 'Standart odaya giriş saati' : 'Standard room entry time'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] text-subtle uppercase tracking-wider">
                {isTr ? 'Check-out Saati' : 'Check-out Time'}
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={e => setCheckOutTime(e.target.value)}
                className={inputCls}
                required
              />
              <p className="text-[10px] text-subtle">
                {isTr ? 'Standart odadan çıkış saati' : 'Standard room departure time'}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="surface-card px-4 py-3 flex gap-6 flex-wrap">
            <div>
              <p className="text-[9px] text-subtle uppercase tracking-wider mb-1">{isTr ? 'Önizleme' : 'Preview'}</p>
              <p className="text-xs text-muted">
                {isTr ? 'Giriş' : 'Check-in'}: <span className="text-brand-accent font-semibold">{checkInTime}</span>
                <span className="mx-3 text-faint">·</span>
                {isTr ? 'Çıkış' : 'Check-out'}: <span className="text-brand-accent font-semibold">{checkOutTime}</span>
              </p>
            </div>
          </div>

          {message && (
            <p className={`text-xs ${isError ? 'text-red-400' : 'text-emerald-400'}`}>{message}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-black text-xs font-bold disabled:opacity-50 hover:brightness-105 transition-all"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? (isTr ? 'Kaydediliyor…' : 'Saving…') : (isTr ? 'Kaydet' : 'Save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminSettings({ tr: isTr }: { tr: boolean }) {
  const [view, setView] = useState<View>('main');
  const { theme, setTheme, mode } = useTheme();

  // ── Appearance sub-view ────────────────────────────────────────────────────
  if (view === 'appearance') {
    return (
      <div className="space-y-5 max-w-3xl">

        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('main')}
            className="flex items-center gap-1.5 text-xs text-subtle hover:text-main transition-colors"
          >
            <ChevronLeft size={14} />
            {isTr ? 'Sistem Ayarları' : 'Settings'}
          </button>
          <span className="text-faint">/</span>
          <span className="text-xs text-muted font-medium">
            {isTr ? 'Görünüm' : 'Appearance'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
            <Palette size={18} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-main leading-none">
              {isTr ? 'Tema Seçimi' : 'Theme Selection'}
            </h2>
            <p className="text-[11px] text-subtle mt-0.5">
              {isTr
                ? 'Sitenin global renk paletini ve temasını değiştirin.'
                : 'Change the global color palette and theme of the site.'}
            </p>
          </div>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            const activeBase = mode === 'light' ? t.lightBase : t.base;
            const activeSurface = mode === 'light' ? t.lightSurface : t.surface;
            const previewBase = mode === 'light' ? t.base : t.lightBase;
            const previewSurface = mode === 'light' ? t.surface : t.lightSurface;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id as Parameters<typeof setTheme>[0])}
                className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-brand-accent/10 border-brand-accent shadow-lg shadow-brand-accent/10'
                    : 'surface-card hover:border-m-border2 hover:bg-m-hover'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-main">{t.name}</span>
                    <p className="text-[10px] text-subtle mt-0.5 leading-snug">{t.mood}</p>
                  </div>
                  {isActive && (
                    <CheckCircle2 size={13} className="text-brand-accent shrink-0" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_1fr_2rem] gap-1.5">
                    <div className="h-8 rounded-lg border border-m-border" style={{ backgroundColor: activeBase }} />
                    <div className="h-8 rounded-lg border border-m-border" style={{ backgroundColor: activeSurface }} />
                    <div className="h-8 rounded-lg border border-m-border" style={{ backgroundColor: t.accent }} />
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_2rem] gap-1.5 opacity-55">
                    <div className="h-2 rounded-full border border-m-border" style={{ backgroundColor: previewBase }} />
                    <div className="h-2 rounded-full border border-m-border" style={{ backgroundColor: previewSurface }} />
                    <div className="h-2 rounded-full border border-m-border" style={{ backgroundColor: t.accent }} />
                  </div>
                </div>
                {isActive && (
                  <div className="mt-2.5">
                    <span className="text-[9px] text-brand-accent font-bold uppercase tracking-widest">
                      {isTr ? 'Aktif' : 'Active'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    );
  }

  // ── Hotel hours sub-view ──────────────────────────────────────────────────
  if (view === 'hotel-hours') {
    return <HotelHoursView isTr={isTr} onBack={() => setView('main')} />;
  }

  // ── Main settings view ─────────────────────────────────────────────────────

  const cards = [
    {
      id: 'appearance',
      Icon: Palette,
      title: isTr ? 'Görünüm' : 'Appearance',
      desc: isTr
        ? 'Sitenin global renk paletini ve tema şemasını değiştirin.'
        : 'Change the global color palette and theme of the site.',
      badge: isTr ? 'Aktif' : 'Active',
      available: true,
      onClick: () => setView('appearance'),
    },
    {
      id: 'hotel-hours',
      Icon: Clock,
      title: isTr ? 'Otel Saatleri' : 'Hotel Hours',
      desc: isTr
        ? 'Standart check-in ve check-out saatlerini belirleyin.'
        : 'Set standard check-in and check-out times.',
      badge: null,
      available: true,
      onClick: () => setView('hotel-hours'),
    },
    {
      id: 'pricing',
      Icon: CreditCard,
      title: isTr ? 'Fiyatlandırma' : 'Pricing',
      desc: isTr
        ? 'Oda fiyatları, sezon tarifeleri ve indirim kuralları.'
        : 'Room prices, seasonal rates and discount rules.',
      badge: null,
      available: false,
      onClick: undefined,
    },
    {
      id: 'notifications',
      Icon: Bell,
      title: isTr ? 'Bildirimler' : 'Notifications',
      desc: isTr
        ? 'E-posta bildirimleri ve sistem uyarı ayarları.'
        : 'Email notification and system alert settings.',
      badge: null,
      available: false,
      onClick: undefined,
    },
    {
      id: 'system',
      Icon: Server,
      title: isTr ? 'Sistem' : 'System',
      desc: isTr
        ? 'Genel sistem yapılandırmaları ve bakım ayarları.'
        : 'General system configuration and maintenance settings.',
      badge: null,
      available: false,
      onClick: undefined,
    },
  ] as const;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-m-surface2 border border-m-border flex items-center justify-center">
          <Server size={18} className="text-subtle" />
        </div>
        <div>
          <h2 className="text-base font-bold text-main leading-none">
            {isTr ? 'Sistem Ayarları' : 'System Settings'}
          </h2>
          <p className="text-[11px] text-subtle mt-0.5">
            {isTr
              ? 'Site yapılandırması ve genel sistem ayarları.'
              : 'Site configuration and general system settings.'}
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(({ id, Icon, title, desc, badge, available, onClick }) => (
          <div
            key={id}
            onClick={available ? onClick : undefined}
            className={`
              relative p-5 rounded-xl border transition-all
              ${available
                ? 'surface-card hover:border-m-border2 hover:bg-m-hover cursor-pointer group'
                : 'surface-card opacity-45 cursor-not-allowed'}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                available
                  ? 'bg-brand-accent/10 border-brand-accent/20 group-hover:bg-brand-accent/15'
                  : 'bg-m-surface2 border-m-border'
              }`}>
                <Icon size={18} className={available ? 'text-brand-accent' : 'text-subtle'} />
              </div>

              {available ? (
                <ChevronRight
                  size={15}
                  className="text-subtle group-hover:text-brand-accent/70 transition-colors mt-0.5 shrink-0"
                />
              ) : (
                <span className="text-[9px] text-subtle font-bold uppercase tracking-widest mt-1 shrink-0">
                  {isTr ? 'Yakında' : 'Soon'}
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-main">{title}</p>
                {badge && (
                  <span className="inline-flex px-1.5 py-0.5 rounded-md bg-brand-accent/15 border border-brand-accent/20 text-[9px] text-brand-accent font-bold uppercase tracking-wide">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
