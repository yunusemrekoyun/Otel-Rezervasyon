'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut, Calendar, User, Settings, MessageSquare,
  BedDouble, Moon, Sun, Star, ChevronRight, Bell,
  Wifi, Coffee, Car, UtensilsCrossed, Baby,
  Cigarette, ArrowUpDown, Pilcrow, Globe, Shield,
  ChevronDown, CheckCircle2, Building2, Home,
  Plus, IdCard, Save, Users, MailCheck, X,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { CustomerReservations } from '@/components/customer/CustomerReservations';
import type { AuthUser } from '@/lib/auth/session';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { BirthDateInput, formatBirthDate } from '@/components/ui/BirthDateInput';
import { TcInput, maskTc } from '@/components/ui/TcInput';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CustomerDashboardProps {
  user: AuthUser;
  authSource: 'access' | 'refresh';
}

type TabId = 'reservations' | 'profile' | 'preferences' | 'support';

interface AccountPerson {
  id: string;
  label: string | null;
  relation: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  nationality: string | null;
  tcKimlikNo: string | null;
  passportNo: string | null;
  passportExpiry: string | null;
  companyName: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
}

// ── Loyalty helpers ────────────────────────────────────────────────────────────

const TIERS = [
  { id: 'bronze', labelTr: 'Bronz',  labelEn: 'Bronze',  minPts: 0,    color: 'text-amber-600',   bg: 'bg-amber-600/10',   border: 'border-amber-600/20'   },
  { id: 'silver', labelTr: 'Gümüş',  labelEn: 'Silver',  minPts: 2000, color: 'text-slate-300',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20'   },
  { id: 'gold',   labelTr: 'Altın',  labelEn: 'Gold',    minPts: 5000, color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20'  },
  { id: 'elite',  labelTr: 'Elite',  labelEn: 'Elite',   minPts: 10000,color: 'text-brand-accent', bg: 'bg-brand-accent/10',border: 'border-brand-accent/20'},
];

// Dummy points — later will come from API
const DUMMY_POINTS = 2400;

function getTier(pts: number) {
  return [...TIERS].reverse().find(t => pts >= t.minPts) ?? TIERS[0];
}

function getNextTier(pts: number) {
  return TIERS.find(t => t.minPts > pts) ?? null;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ email, size = 'lg' }: { email: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = email.slice(0, 2).toUpperCase();
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' }[size];
  return (
    <div className={`${sz} rounded-full bg-brand-accent/15 border-2 border-brand-accent/30 flex items-center justify-center font-bold text-brand-accent shrink-0`}>
      {initials}
    </div>
  );
}

// ── Profile Hero ───────────────────────────────────────────────────────────────

function ProfileHero({ user, tr }: { user: AuthUser; tr: boolean }) {
  const pts      = DUMMY_POINTS;
  const tier     = getTier(pts);
  const nextTier = getNextTier(pts);
  const progress = nextTier ? Math.round(((pts - tier.minPts) / (nextTier.minPts - tier.minPts)) * 100) : 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-white/4 via-white/2 to-transparent p-6">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-accent/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-brand-accent/3 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Avatar */}
        <Avatar email={user.email} size="xl" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-white leading-none">
              {tr ? 'Hoş Geldiniz' : 'Welcome back'}
            </h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${tier.bg} ${tier.border} ${tier.color}`}>
              <Star size={8} />
              {tr ? tier.labelTr : tier.labelEn}
            </span>
          </div>
          <p className="text-white/40 text-sm truncate mb-3">{user.email}</p>

          {/* Quick stats */}
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { icon: BedDouble, value: '3',      label: tr ? 'Konaklama' : 'Stays' },
              { icon: Moon,      value: '8',       label: tr ? 'Gece'     : 'Nights' },
              { icon: Star,      value: pts.toLocaleString('tr-TR'), label: tr ? 'Puan' : 'Points' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={13} className="text-brand-accent/60" />
                <span className="text-sm font-bold text-white">{value}</span>
                <span className="text-xs text-white/35">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty progress (desktop) */}
        {nextTier && (
          <div className="hidden md:block w-48 shrink-0">
            <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
              <span>{tr ? tier.labelTr : tier.labelEn}</span>
              <span>{tr ? nextTier.labelTr : nextTier.labelEn}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-accent transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/25 mt-1.5 text-right">
              {(nextTier.minPts - pts).toLocaleString('tr-TR')} {tr ? 'puan kaldı' : 'pts to go'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab Nav ────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; labelTr: string; labelEn: string; icon: React.ElementType }[] = [
  { id: 'reservations', labelTr: 'Rezervasyonlarım', labelEn: 'My Stays',    icon: Calendar     },
  { id: 'profile',      labelTr: 'Profilim',         labelEn: 'Profile',     icon: User         },
  { id: 'preferences',  labelTr: 'Tercihlerim',      labelEn: 'Preferences', icon: Settings     },
  { id: 'support',      labelTr: 'Destek',           labelEn: 'Support',     icon: MessageSquare},
];

function TabNav({ active, setActive, tr }: { active: TabId; setActive: (t: TabId) => void; tr: boolean }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar bg-white/3 border border-white/8 rounded-xl p-1">
      {TABS.map(t => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              isActive
                ? 'bg-brand-accent text-black shadow-sm'
                : 'text-white/45 hover:text-white/75 hover:bg-white/5'
            }`}
          >
            <Icon size={13} />
            {tr ? t.labelTr : t.labelEn}
          </button>
        );
      })}
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-accent/40 transition-colors';

function PersonInfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-white/25">{label}</p>
      <p className="text-xs text-white/70 mt-0.5">{value || '—'}</p>
    </div>
  );
}

function PersonCard({ person, tr }: { person: AccountPerson; tr: boolean }) {
  const relationLabel = person.relation === 'self'
    ? tr ? 'Hesap sahibi' : 'Account owner'
    : tr ? 'Rezervasyon kişisi' : 'Reservation guest';

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
            <User size={17} className="text-brand-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{person.firstName} {person.lastName}</p>
            <p className="text-[11px] text-white/35">{person.label || relationLabel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {person.isDefault && (
            <span className="rounded-full border border-brand-accent/25 bg-brand-accent/10 px-2 py-0.5 text-[9px] font-bold text-brand-accent">
              {tr ? 'Varsayılan' : 'Default'}
            </span>
          )}
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/45">
            {relationLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PersonInfoRow label="E-posta" value={person.email} />
        <PersonInfoRow label={tr ? 'Telefon' : 'Phone'} value={person.phone} />
        <PersonInfoRow label={tr ? 'Doğum tarihi' : 'Birth date'} value={formatBirthDate(person.birthDate, tr)} />
        <PersonInfoRow label={tr ? 'Uyruk' : 'Nationality'} value={person.nationality} />
        <PersonInfoRow label={tr ? 'T.C. kimlik no' : 'National ID'} value={person.tcKimlikNo ? maskTc(person.tcKimlikNo) : null} />
        <PersonInfoRow label={tr ? 'Pasaport no' : 'Passport no'} value={person.passportNo} />
        <PersonInfoRow label={tr ? 'Pasaport bitiş' : 'Passport expiry'} value={person.passportExpiry} />
        <PersonInfoRow label={tr ? 'Cinsiyet' : 'Gender'} value={person.gender} />
        <PersonInfoRow label={tr ? 'Şirket' : 'Company'} value={person.companyName} />
        <PersonInfoRow label={tr ? 'Vergi no' : 'Tax no'} value={person.taxNumber} />
      </div>
    </div>
  );
}

function ProfileTab({
  user,
  tr,
  people,
  onPeopleChanged,
}: {
  user: AuthUser;
  tr: boolean;
  people: AccountPerson[];
  onPeopleChanged: (people: AccountPerson[]) => void;
}) {
  const [ownerForm, setOwnerForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    nationality: 'TR',
    tcKimlikNo: '',
  });
  const [savingOwner, setSavingOwner] = useState(false);
  const [ownerMessage, setOwnerMessage] = useState('');
  const [verifyHidden, setVerifyHidden] = useState(false);
  const [verifyState, setVerifyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const hasDefaultOwner = people.some((person) => person.isDefault && person.relation === 'self');

  async function resendVerification() {
    setVerifyState('sending');
    try {
      const response = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => null);
      setVerifyState(response.ok && payload?.ok ? 'sent' : 'error');
    } catch {
      setVerifyState('error');
    }
  }

  async function saveOwnerProfile(event: FormEvent) {
    event.preventDefault();
    if (!ownerForm.firstName || !ownerForm.lastName || !ownerForm.phone) return;

    setSavingOwner(true);
    setOwnerMessage('');

    try {
      const response = await fetch('/api/account/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relation: 'self',
          isDefault: true,
          email: user.email,
          ...ownerForm,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || 'Profil kaydedilemedi.');
      }

      const list = await fetch('/api/account/people').then((res) => res.json()).catch(() => null);
      if (list?.ok) onPeopleChanged(list.people);
      setOwnerMessage(tr ? 'Bilgileriniz kaydedildi.' : 'Your details have been saved.');
      setOwnerForm({ firstName: '', lastName: '', phone: '', birthDate: '', nationality: 'TR', tcKimlikNo: '' });
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : (tr ? 'Bilgiler kaydedilemedi.' : 'Details could not be saved.'));
    } finally {
      setSavingOwner(false);
    }
  }

  return (
    <div className="space-y-4">
      {!user.emailVerified && !verifyHidden && (
        <div className="rounded-2xl border border-brand-accent/25 bg-brand-accent/8 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/12 border border-brand-accent/25 flex items-center justify-center shrink-0">
              <MailCheck size={18} className="text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">
                {tr ? 'E-posta adresinizi doğrulayın' : 'Verify your email address'}
              </h3>
              <p className="text-xs text-white/45 leading-relaxed mt-1">
                {tr
                  ? 'Profil ve güvenlik işlemlerinde hesabın size ait olduğundan emin olmak için e-postanızı doğrulamanızı öneririz.'
                  : 'We recommend verifying your email before profile and security changes so your account ownership is clear.'}
              </p>
              {verifyState === 'sent' && (
                <p className="text-xs text-brand-accent/80 mt-2">
                  {tr ? 'Doğrulama bağlantısı e-posta adresinize gönderildi.' : 'Verification link has been sent to your email.'}
                </p>
              )}
              {verifyState === 'error' && (
                <p className="text-xs text-red-300 mt-2">
                  {tr ? 'E-posta gönderilemedi. Daha sonra tekrar deneyin.' : 'Email could not be sent. Please try again later.'}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={verifyState === 'sending'}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
                >
                  <MailCheck size={12} />
                  {verifyState === 'sending' ? (tr ? 'Gönderiliyor…' : 'Sending…') : (tr ? 'Hemen doğrula' : 'Verify now')}
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyHidden(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/35 hover:text-white/60"
                >
                  <X size={11} />
                  {tr ? 'Hayır teşekkürler' : 'No thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users size={14} className="text-brand-accent" />
              {tr ? 'Hesaba Tanımlı Bireyler' : 'People on This Account'}
            </h3>
            <p className="text-xs text-white/35 mt-1 leading-relaxed">
              {tr
                ? 'Kendiniz, aile üyeleriniz ya da adına rezervasyon yaptığınız kişiler burada kart olarak tutulur. Rezervasyon sırasında doğru kişiyi seçmek daha hızlı olur.'
                : 'You can keep yourself, family members, or guests you book for as cards here. It makes future reservations faster.'}
            </p>
          </div>
          <span className="rounded-full bg-white/5 border border-white/8 px-2.5 py-1 text-[10px] text-white/45">
            {people.length} {tr ? 'kayıt' : 'saved'}
          </span>
        </div>

        {!hasDefaultOwner && (
          <form onSubmit={saveOwnerProfile} className="rounded-xl border border-brand-accent/20 bg-brand-accent/7 p-4 mb-4 space-y-3">
            <div className="flex items-start gap-2">
              <IdCard size={15} className="text-brand-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {tr ? 'Kendi bilgilerinizi tamamlayın' : 'Complete your own details'}
                </p>
                <p className="text-xs text-white/45 leading-relaxed mt-1">
                  {tr
                    ? 'Rezervasyonu başka biri adına yaptıysanız onu zaten ekledik. Buraya kendi bilgilerinizi yazarsanız sonraki işlemlerde hesabın sahibi net görünür.'
                    : 'If you booked for someone else, we already saved that guest. Add your own details here so the account owner is clear next time.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder={tr ? 'Adınız' : 'First name'} value={ownerForm.firstName} onChange={(e) => setOwnerForm((p) => ({ ...p, firstName: e.target.value }))} />
              <input className={inputCls} placeholder={tr ? 'Soyadınız' : 'Last name'} value={ownerForm.lastName} onChange={(e) => setOwnerForm((p) => ({ ...p, lastName: e.target.value }))} />
              <PhoneInput
                value={ownerForm.phone}
                onChange={v => setOwnerForm(p => ({ ...p, phone: v }))}
              />
              <BirthDateInput
                value={ownerForm.birthDate}
                onChange={v => setOwnerForm(p => ({ ...p, birthDate: v }))}
                tr={tr}
              />
              <input className={inputCls} placeholder={tr ? 'Uyruk' : 'Nationality'} value={ownerForm.nationality} onChange={(e) => setOwnerForm((p) => ({ ...p, nationality: e.target.value }))} />
              <TcInput
                value={ownerForm.tcKimlikNo}
                onChange={v => setOwnerForm(p => ({ ...p, tcKimlikNo: v }))}
              />
            </div>
            {ownerMessage && <p className="text-xs text-brand-accent/80">{ownerMessage}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingOwner || !ownerForm.firstName || !ownerForm.lastName || !ownerForm.phone}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
              >
                <Save size={12} />
                {savingOwner ? (tr ? 'Kaydediliyor…' : 'Saving…') : (tr ? 'Bilgilerimi Kaydet' : 'Save My Details')}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} tr={tr} />
          ))}
          {people.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/3 p-5 text-center">
              <Plus size={18} className="mx-auto text-white/25 mb-2" />
              <p className="text-sm text-white/60">{tr ? 'Henüz kayıtlı birey yok.' : 'No saved people yet.'}</p>
              <p className="text-xs text-white/30 mt-1">{tr ? 'İlk rezervasyon veya profil kaydıyla burası dolacak.' : 'This area fills after your first reservation or profile entry.'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={14} className="text-brand-accent" />
          {tr ? 'Güvenlik' : 'Security'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: tr ? 'Mevcut Şifre' : 'Current Password' },
            { label: tr ? 'Yeni Şifre' : 'New Password' },
            { label: tr ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password' },
          ].map(f => (
            <div key={f.label} className={f.label.includes('Tekrar') || f.label.includes('Confirm') ? 'sm:col-span-2 sm:max-w-[calc(50%-6px)]' : ''}>
              <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1.5">{f.label}</label>
              <input type="password" className={inputCls} placeholder="••••••••" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-5 py-2 rounded-lg bg-white/8 border border-white/10 text-white/50 text-xs font-medium cursor-not-allowed">
            {tr ? 'Şifreyi Güncelle' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Bell size={14} className="text-brand-accent" />
          {tr ? 'Bildirim Tercihleri' : 'Notification Preferences'}
        </h3>
        <div className="space-y-3">
          {[
            { label: tr ? 'Rezervasyon onayları (e-posta)' : 'Reservation confirmations (email)', on: true  },
            { label: tr ? 'Check-in hatırlatıcısı'         : 'Check-in reminders',                on: true  },
            { label: tr ? 'Kampanya ve fırsatlar'          : 'Campaigns & offers',                on: false },
            { label: tr ? 'Yeni özellik duyuruları'        : 'New feature announcements',         on: false },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between">
              <span className="text-sm text-white/60">{n.label}</span>
              <div className={`w-9 h-5 rounded-full relative cursor-not-allowed transition-colors ${n.on ? 'bg-brand-accent/40' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${n.on ? 'left-4 bg-brand-accent' : 'left-0.5 bg-white/30'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Preferences Tab ────────────────────────────────────────────────────────────

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-9 h-5 rounded-full relative cursor-not-allowed flex-shrink-0 ${on ? 'bg-brand-accent/40' : 'bg-white/8'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${on ? 'left-4 bg-brand-accent' : 'left-0.5 bg-white/25'}`} />
    </div>
  );
}

function PrefSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Icon size={14} className="text-brand-accent" />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PrefRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-white/70">{label}</p>
        {desc && <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SelectPill({ options, active }: { options: string[]; active: string }) {
  return (
    <div className="flex gap-1 shrink-0">
      {options.map(o => (
        <span
          key={o}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-not-allowed transition-colors ${
            o === active ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30' : 'bg-white/5 text-white/35 border border-transparent'
          }`}
        >
          {o}
        </span>
      ))}
    </div>
  );
}

function PreferencesTab({ tr }: { tr: boolean }) {
  return (
    <div className="space-y-4">
      <PrefSection title={tr ? 'Oda Tercihleri' : 'Room Preferences'} icon={BedDouble}>
        <PrefRow label={tr ? 'Yatak Tipi' : 'Bed Type'}>
          <SelectPill options={tr ? ['Tek', 'Çift', 'Twin'] : ['Single', 'Double', 'Twin']} active={tr ? 'Çift' : 'Double'} />
        </PrefRow>
        <PrefRow label={tr ? 'Kat Tercihi' : 'Floor Preference'}>
          <SelectPill options={tr ? ['Alçak', 'Orta', 'Yüksek'] : ['Low', 'Mid', 'High']} active={tr ? 'Yüksek' : 'High'} />
        </PrefRow>
        <PrefRow label={tr ? 'Manzara' : 'View'}>
          <SelectPill options={tr ? ['Bahçe', 'Havuz', 'Şehir'] : ['Garden', 'Pool', 'City']} active={tr ? 'Bahçe' : 'Garden'} />
        </PrefRow>
        <PrefRow label={tr ? 'Sigara İçilmeyen Oda' : 'Non-smoking Room'}>
          <Toggle on={true} />
        </PrefRow>
      </PrefSection>

      <PrefSection title={tr ? 'Konaklama & Servis' : 'Stay & Service'} icon={Coffee}>
        <PrefRow label={tr ? 'Kahvaltı Dahil' : 'Breakfast Included'} desc={tr ? 'Oda fiyatına ekle' : 'Add to room rate'}>
          <Toggle on={true} />
        </PrefRow>
        <PrefRow label={tr ? 'Erken Check-in' : 'Early Check-in'} desc={tr ? 'Müsaitse otomatik talep et' : 'Auto-request if available'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Geç Check-out' : 'Late Check-out'} desc={tr ? 'Müsaitse otomatik talep et' : 'Auto-request if available'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Oda Servisi' : 'Room Service'} desc={tr ? 'Check-in\'de hatırlat' : 'Remind at check-in'}>
          <Toggle on={true} />
        </PrefRow>
      </PrefSection>

      <PrefSection title={tr ? 'Yastık & Yatak' : 'Pillow & Bedding'} icon={Pilcrow}>
        <PrefRow label={tr ? 'Yastık Sertliği' : 'Pillow Firmness'}>
          <SelectPill options={tr ? ['Yumuşak', 'Orta', 'Sert'] : ['Soft', 'Medium', 'Firm']} active={tr ? 'Orta' : 'Medium'} />
        </PrefRow>
        <PrefRow label={tr ? 'Ekstra Yorgan' : 'Extra Blanket'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Hipo-Alerjenik Ürünler' : 'Hypoallergenic Products'}>
          <Toggle on={true} />
        </PrefRow>
      </PrefSection>

      <PrefSection title={tr ? 'Yiyecek & İçecek' : 'Food & Beverage'} icon={UtensilsCrossed}>
        <PrefRow label={tr ? 'Diyet Tercihi' : 'Dietary Preference'}>
          <SelectPill options={tr ? ['Yok', 'Vejetaryen', 'Vegan', 'Helal'] : ['None', 'Vegetarian', 'Vegan', 'Halal']} active={tr ? 'Yok' : 'None'} />
        </PrefRow>
        <PrefRow label={tr ? 'Gluten İçermez' : 'Gluten-Free'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Minibar Stoğu' : 'Minibar Stock'} desc={tr ? 'Check-in\'de hazır olsun' : 'Ready at check-in'}>
          <Toggle on={true} />
        </PrefRow>
      </PrefSection>

      <PrefSection title={tr ? 'Diğer' : 'Other'} icon={Settings}>
        <PrefRow label={tr ? 'Bebek Karyolası' : 'Baby Cot'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Vale Park Hizmeti' : 'Valet Parking'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Evcil Hayvan Dostu Oda' : 'Pet-Friendly Room'}>
          <Toggle on={false} />
        </PrefRow>
        <PrefRow label={tr ? 'Dil Tercihi' : 'Language'}>
          <SelectPill options={['TR', 'EN']} active={tr ? 'TR' : 'EN'} />
        </PrefRow>
      </PrefSection>

      <p className="text-[10px] text-white/20 text-center pb-2">
        {tr
          ? 'Tercihler bilgi amaçlıdır. Kesin talepler için özel istekler bölümünü kullanın.'
          : 'Preferences are informational. Use special requests for guaranteed arrangements.'}
      </p>
    </div>
  );
}

// ── Support Tab ────────────────────────────────────────────────────────────────

const FAQ_TR = [
  { q: 'Check-in saati nedir?',       a: 'Standart check-in saatimiz 14:00\'tir. Erken check-in talep edebilirsiniz.' },
  { q: 'Check-out saati nedir?',      a: 'Standart check-out saatimiz 12:00\'dir. Geç check-out ek ücrete tabidir.' },
  { q: 'Rezervasyonumu nasıl iptal edebilirim?', a: '48 saat öncesine kadar ücretsiz iptal yapabilirsiniz.' },
  { q: 'Transfer hizmeti var mı?',    a: 'Evet, havalimanı transferi için resepsiyon ile iletişime geçin.' },
  { q: 'Ücretsiz Wi-Fi var mı?',     a: 'Tüm odalarda ve ortak alanlarda ücretsiz yüksek hızlı Wi-Fi mevcuttur.' },
];

const FAQ_EN = [
  { q: 'What is the check-in time?',        a: 'Standard check-in is at 14:00. Early check-in can be requested.' },
  { q: 'What is the check-out time?',       a: 'Standard check-out is at 12:00. Late check-out may incur additional charges.' },
  { q: 'How can I cancel my reservation?',  a: 'Free cancellation is available up to 48 hours before check-in.' },
  { q: 'Is transfer service available?',    a: 'Yes, please contact reception for airport transfer arrangements.' },
  { q: 'Is Wi-Fi free?',                   a: 'Yes, complimentary high-speed Wi-Fi is available in all rooms and common areas.' },
];

function SupportTab({ tr }: { tr: boolean }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = tr ? FAQ_TR : FAQ_EN;

  return (
    <div className="space-y-4">
      {/* Contact card */}
      <div className="bg-brand-accent/5 border border-brand-accent/15 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shrink-0 shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" style={{ objectPosition: 'left center' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Garden Hotel</p>
            <p className="text-[11px] text-white/35">{tr ? 'Resepsiyon — 7/24 hizmetinizde' : 'Reception — Available 24/7'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
          {[
            { icon: Globe,       label: tr ? 'Web Sitesi'    : 'Website',   value: 'gardenhotel.com',       cls: 'text-brand-accent' },
            { icon: MessageSquare, label: tr ? 'E-posta'     : 'Email',     value: 'info@gardenhotel.com',  cls: 'text-white/60' },
            { icon: Bell,        label: tr ? 'Telefon'       : 'Phone',     value: '+90 (212) 000 00 00',   cls: 'text-white/60' },
          ].map(c => (
            <div key={c.label} className="bg-white/4 border border-white/8 rounded-xl p-3">
              <c.icon size={13} className={`${c.cls} mb-1.5`} />
              <p className="text-[9px] text-white/30 uppercase tracking-wider">{c.label}</p>
              <p className={`text-xs font-medium mt-0.5 ${c.cls}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Message form (static) */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare size={14} className="text-brand-accent" />
          {tr ? 'Mesaj Gönder' : 'Send a Message'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
              {tr ? 'Konu' : 'Subject'}
            </label>
            <select className={`${inputCls} appearance-none`} disabled>
              <option>{tr ? 'Rezervasyon hakkında' : 'About a reservation'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
              {tr ? 'Mesajınız' : 'Your message'}
            </label>
            <textarea
              className={`${inputCls} resize-none h-24`}
              placeholder={tr ? 'Mesajınızı buraya yazın…' : 'Type your message here…'}
              disabled
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-5 py-2 rounded-lg bg-brand-accent/30 text-brand-accent/60 text-xs font-bold cursor-not-allowed border border-brand-accent/20">
            {tr ? 'Gönder' : 'Send'}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">{tr ? 'Sık Sorulan Sorular' : 'FAQ'}</h3>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="border border-white/6 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm text-white/70 hover:text-white hover:bg-white/3 transition-colors"
              >
                <span>{f.q}</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-white/30 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-3 text-sm text-white/40 leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Loyalty Card ───────────────────────────────────────────────────────────────

function LoyaltyCard({ tr }: { tr: boolean }) {
  const pts      = DUMMY_POINTS;
  const tier     = getTier(pts);
  const nextTier = getNextTier(pts);
  const progress = nextTier ? Math.round(((pts - tier.minPts) / (nextTier.minPts - tier.minPts)) * 100) : 100;

  const perks_tr = ['Ücretsiz oda yükseltme (%10)', 'Geç check-out (13:00)', 'Karşılama içeceği'];
  const perks_en = ['Free room upgrade (10%)', 'Late check-out (13:00)', 'Welcome drink'];
  const perks    = tr ? perks_tr : perks_en;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${tier.bg} ${tier.border}`}>
      <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl bg-brand-accent" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold mb-1 ${tier.color}`}>
            <Star size={12} />
            {tr ? `Garden Hotel ${tier.labelTr} Üye` : `Garden Hotel ${tier.labelEn} Member`}
          </div>
          <p className="text-2xl font-bold text-white">{pts.toLocaleString('tr-TR')}</p>
          <p className="text-[11px] text-white/35">{tr ? 'kullanılabilir puan' : 'available points'}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Building2 size={18} className="text-brand-accent/60" />
        </div>
      </div>

      {nextTier && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full bg-brand-accent`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            {tr
              ? `${tier.labelTr} → ${nextTier.labelTr} için ${(nextTier.minPts - pts).toLocaleString()} puan kaldı`
              : `${(nextTier.minPts - pts).toLocaleString()} pts to ${nextTier.labelEn}`}
          </p>
        </div>
      )}

      <div className="border-t border-white/8 pt-3 space-y-1.5">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
          {tr ? 'Mevcut Ayrıcalıklar' : 'Current Perks'}
        </p>
        {perks.map(p => (
          <div key={p} className="flex items-center gap-2">
            <CheckCircle2 size={11} className={tier.color} />
            <span className="text-xs text-white/55">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CustomerDashboard({ user, authSource }: CustomerDashboardProps) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const tr = language === 'tr';
  const [activeTab, setActiveTab] = useState<TabId>('reservations');
  const [loggingOut, setLoggingOut] = useState(false);
  const [mode, setModeState] = useState<'dark' | 'light'>('light');
  const [people, setPeople] = useState<AccountPerson[]>([]);
  const [peopleLoaded, setPeopleLoaded] = useState(false);
  const [showProfileSetupPrompt, setShowProfileSetupPrompt] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wn-customer-mode-v2');
    if (saved === 'dark' || saved === 'light') setModeState(saved);
  }, []);

  useEffect(() => {
    fetch('/api/account/people')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPeople(data.people);
          const hasDefaultOwner = (data.people as AccountPerson[]).some((person) => person.isDefault && person.relation === 'self');
          if (!hasDefaultOwner) setShowProfileSetupPrompt(true);
        }
      })
      .catch(() => undefined)
      .finally(() => setPeopleLoaded(true));
  }, []);

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setModeState(next);
    localStorage.setItem('wn-customer-mode-v2', next);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await fetch('/api/auth/logout', { method: 'POST' }); }
    finally { router.replace('/'); router.refresh(); }
  };

  return (
    <div data-mode={mode} className={`min-h-screen panel-root${mode === 'light' ? ' mode-light' : ''}`}>
      <AnimatePresence>
        {peopleLoaded && showProfileSetupPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#15120f] p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center shrink-0">
                  <IdCard size={18} className="text-brand-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {tr ? 'Hesabınızı tamamlayalım' : 'Let’s complete your account'}
                  </h2>
                  <p className="text-sm text-white/50 leading-relaxed mt-2">
                    {tr
                      ? 'Rezervasyon kişisini kaydettik. Hesap sahibi olarak kendi bilgilerinizi de eklerseniz sonraki rezervasyonlarda kimin adına işlem yaptığınızı daha rahat seçersiniz.'
                      : 'We saved the reservation guest. Add your own details as the account owner so future bookings are easier to manage.'}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setShowProfileSetupPrompt(false);
                    setActiveTab('profile');
                  }}
                  className="flex-1 rounded-lg bg-brand-accent px-4 py-2.5 text-xs font-bold text-black hover:bg-brand-accent/90 transition-colors"
                >
                  {tr ? 'Bilgilerimi ekle' : 'Add my details'}
                </button>
                <button
                  onClick={() => setShowProfileSetupPrompt(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/55 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {tr ? 'Sonra yaparım' : 'I’ll do it later'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 border-b border-white/6 backdrop-blur-md" style={{ background: 'var(--m-topbar)' }}>
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white overflow-hidden shrink-0 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" style={{ objectPosition: 'left center' }} />
            </div>
            <span className="text-sm font-bold text-white/90">Garden Hotel</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-[10px] font-bold text-white/50 hover:text-white transition-colors"
            >
              <Home size={11} />
              <span className="hidden sm:inline">{tr ? 'Ana Sayfa' : 'Home'}</span>
            </button>
            <button
              onClick={toggleMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-[10px] font-bold text-white/50 hover:text-white transition-colors"
            >
              {mode === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
              {mode === 'dark' ? (tr ? 'Açık' : 'Light') : (tr ? 'Koyu' : 'Dark')}
            </button>
            <button
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-[10px] font-bold text-white/50 hover:text-white transition-colors"
            >
              {language.toUpperCase()}
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-xs text-white/50 hover:text-white transition-colors"
            >
              <LogOut size={12} />
              {loggingOut ? '…' : (tr ? 'Çıkış' : 'Sign out')}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <ProfileHero user={user} tr={tr} />

        {/* Two-column layout: tabs+content left, loyalty right */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left: tabs + content */}
          <div className="flex-1 min-w-0 space-y-4">
            <TabNav active={activeTab} setActive={setActiveTab} tr={tr} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'reservations' && <CustomerReservations user={user} tr={tr} />}
                {activeTab === 'profile'      && <ProfileTab user={user} tr={tr} people={people} onPeopleChanged={setPeople} />}
                {activeTab === 'preferences'  && <PreferencesTab tr={tr} />}
                {activeTab === 'support'      && <SupportTab tr={tr} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: loyalty card (sticky) */}
          <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20">
            <LoyaltyCard tr={tr} />
          </div>
        </div>
      </main>
    </div>
  );
}
