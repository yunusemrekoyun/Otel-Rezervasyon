'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, ChevronLeft, ChevronRight, X, Check,
  User, Phone, Mail, Building2, FileText, BedDouble,
  Loader2, CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  CalendarMonth, SingleDatePickerModal,
  startOfDay, addMonths,
} from '@/components/ui/CalendarPicker';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RoomData {
  id: string;
  name: string;
  floor: number | null;
  status: string;
  basePrice: number;
  description: string | null;
  isActive: boolean;
  maxAdults: number;
  maxChildren: number;
  roomType: { id: string; name: string; amenities: string[] };
}

interface GuestForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  nationality: string;
  tcKimlikNo: string;
  passportNo: string;
  passportExpiry: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  specialRequests: string;
  adultsCount: number;
  childrenCount: number;
}

interface AccountProfile {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  nationality: string | null;
  tcKimlikNo: string | null;
  passportNo: string | null;
  passportExpiry: string | null;
}

type ProfileDecision = 'entered' | 'account';
type NewAccountProfileOwner = 'self' | 'guest';

const emptyForm: GuestForm = {
  firstName: '', lastName: '', email: '', phone: '',
  birthDate: '', gender: '', nationality: 'TR',
  tcKimlikNo: '', passportNo: '', passportExpiry: '',
  companyName: '', taxNumber: '', taxOffice: '',
  specialRequests: '', adultsCount: 1, childrenCount: 0,
};

function normalizeProfileValue(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

function getGuestProfileMismatchLabels(profile: AccountProfile | null, form: GuestForm, isTurkish: boolean, tr: boolean) {
  if (!profile) return [];

  const fields = [
    { label: tr ? 'Ad' : 'First name', account: profile.firstName, entered: form.firstName },
    { label: tr ? 'Soyad' : 'Last name', account: profile.lastName, entered: form.lastName },
    { label: tr ? 'Telefon' : 'Phone', account: profile.phone, entered: form.phone },
    ...(isTurkish
      ? [{ label: tr ? 'T.C. kimlik no' : 'National ID', account: profile.tcKimlikNo, entered: form.tcKimlikNo }]
      : [{ label: tr ? 'Pasaport no' : 'Passport no', account: profile.passportNo, entered: form.passportNo }]),
  ];

  return fields
    .filter(({ account, entered }) => account && entered && normalizeProfileValue(account) !== normalizeProfileValue(entered))
    .map(({ label }) => label);
}

function formWithAccountProfile(form: GuestForm, profile: AccountProfile): GuestForm {
  return {
    ...form,
    firstName: profile.firstName || form.firstName,
    lastName: profile.lastName || form.lastName,
    phone: profile.phone || form.phone,
    birthDate: profile.birthDate || form.birthDate,
    gender: profile.gender || form.gender,
    nationality: profile.nationality || form.nationality,
    tcKimlikNo: profile.tcKimlikNo || form.tcKimlikNo,
    passportNo: profile.passportNo || form.passportNo,
    passportExpiry: profile.passportExpiry || form.passportExpiry,
  };
}

// ── DatePickerModal ────────────────────────────────────────────────────────────

interface DatePickerModalProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onConfirm: (ci: Date, co: Date) => void;
  onClose: () => void;
  tr: boolean;
}

function DatePickerModal({ checkIn: initCi, checkOut: initCo, onConfirm, onClose, tr }: DatePickerModalProps) {
  const today = startOfDay(new Date());
  const [leftMonth, setLeftMonth] = useState(() => {
    const base = initCi ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [checkIn, setCheckIn] = useState<Date | null>(initCi);
  const [checkOut, setCheckOut] = useState<Date | null>(initCo);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [selecting, setSelecting] = useState<'in' | 'out'>(initCi ? 'out' : 'in');

  const rightMonth = addMonths(leftMonth, 1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleSelect(date: Date) {
    if (selecting === 'in') {
      setCheckIn(date);
      setCheckOut(null);
      setSelecting('out');
    } else {
      if (checkIn && date <= checkIn) {
        setCheckIn(date);
        setCheckOut(null);
        setSelecting('out');
      } else {
        setCheckOut(date);
        setSelecting('in');
      }
    }
  }

  const canConfirm = checkIn && checkOut && checkOut > checkIn;

  const nightCount = canConfirm
    ? Math.round((checkOut!.getTime() - checkIn!.getTime()) / 86400000)
    : 0;

  const formatDate = (d: Date | null) => {
    if (!d) return tr ? 'Seçilmedi' : 'Not selected';
    return d.toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-full max-w-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-6 text-sm">
            <button
              onClick={() => setSelecting('in')}
              className={`pb-1 border-b-2 transition-colors ${selecting === 'in' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-white/40 hover:text-white/70'}`}
            >
              {tr ? 'Giriş' : 'Check-in'}: <span className="font-semibold">{formatDate(checkIn)}</span>
            </button>
            <button
              onClick={() => checkIn && setSelecting('out')}
              className={`pb-1 border-b-2 transition-colors ${selecting === 'out' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-white/40 hover:text-white/70'}`}
            >
              {tr ? 'Çıkış' : 'Check-out'}: <span className="font-semibold">{formatDate(checkOut)}</span>
            </button>
            {nightCount > 0 && (
              <span className="text-white/30 text-xs self-end mb-0.5">
                {nightCount} {tr ? 'gece' : 'night'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setLeftMonth(m => addMonths(m, -1))}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setLeftMonth(m => addMonths(m, 1))}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Two months */}
        <div className="flex gap-6">
          <CalendarMonth
            year={leftMonth.getFullYear()} month={leftMonth.getMonth()}
            checkIn={checkIn} checkOut={checkOut} hovered={hovered} today={today}
            minDate={today}
            onSelect={handleSelect} onHover={setHovered} tr={tr}
          />
          <div className="w-px bg-white/5" />
          <CalendarMonth
            year={rightMonth.getFullYear()} month={rightMonth.getMonth()}
            checkIn={checkIn} checkOut={checkOut} hovered={hovered} today={today}
            minDate={today}
            onSelect={handleSelect} onHover={setHovered} tr={tr}
          />
        </div>

        {/* Confirm */}
        <div className="mt-5 flex justify-end">
          <button
            disabled={!canConfirm}
            onClick={() => canConfirm && onConfirm(checkIn!, checkOut!)}
            className="px-5 py-2 rounded-lg bg-brand-accent text-black text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent/90 transition-colors"
          >
            {tr ? 'Tarihleri Onayla' : 'Confirm Dates'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return mounted ? createPortal(modal, document.body) : null;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = ['Oda & Tarih', 'Misafir Bilgileri', 'Onay'];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
            i < step ? 'bg-brand-accent text-black' : i === step ? 'bg-brand-accent/20 border border-brand-accent text-brand-accent' : 'bg-white/5 text-white/20'
          }`}>
            {i < step ? <Check size={12} /> : i + 1}
          </div>
          <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-brand-accent' : i < step ? 'text-white/50' : 'text-white/20'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-brand-accent/40' : 'bg-white/5'}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Input helpers ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
        {label}{required && <span className="text-brand-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-accent/50 transition-colors w-full';
const selectCls = `${inputCls} appearance-none`;

// ── Main Component ─────────────────────────────────────────────────────────────

export function ReservationScreen() {
  const { language } = useLanguage();
  const tr = language === 'tr';

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const [step, setStep] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [showCorporate, setShowCorporate] = useState(false);
  const [isTurkish, setIsTurkish] = useState(true);
  const [showBirthPicker, setShowBirthPicker] = useState(false);

  // Step 2 — email check + account
  const [emailCheckState, setEmailCheckState] = useState<'idle' | 'checking' | 'exists' | 'not-exists'>('idle');
  const [wantsAccount, setWantsAccount] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [existingAccountVerified, setExistingAccountVerified] = useState(false);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [profileDecision, setProfileDecision] = useState<ProfileDecision | null>(null);
  const [passwordResetState, setPasswordResetState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [submitting, setSubmitting] = useState(false);
  const [newAccountProfileOwner, setNewAccountProfileOwner] = useState<NewAccountProfileOwner | null>(null);
  const [result, setResult] = useState<{ ok: boolean; confirmationId?: string; message?: string; needsProfileSetup?: boolean } | null>(null);

  const fetchRooms = useCallback(async (ci?: Date, co?: Date) => {
    setLoadingRooms(true);
    try {
      let url = '/api/rooms';
      if (ci && co) {
        const p = new URLSearchParams({
          checkIn:  ci.toISOString().split('T')[0],
          checkOut: co.toISOString().split('T')[0],
        });
        url = `/api/rooms?${p}`;
        setDateFilterActive(true);
      } else {
        setDateFilterActive(false);
      }
      const r = await fetch(url);
      const data = await r.json();
      if (data.ok) {
        const available = (data.rooms as RoomData[]).filter(r => r.isActive && r.status === 'available');
        setRooms(available);
        // If selected room is no longer available, clear the selection
        setSelectedRoomId(prev => available.find(r => r.id === prev) ? prev : '');
      }
    } catch (e) { console.error(e); }
    finally { setLoadingRooms(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null;

  // Filter rooms by guest capacity in addition to date availability
  const capacityFilteredRooms = rooms.filter(r => {
    const maxA = r.maxAdults  ?? 99;
    const maxC = r.maxChildren ?? 99;
    return maxA >= form.adultsCount && (form.childrenCount === 0 || maxC >= form.childrenCount);
  });

  const nights = checkIn && checkOut
    ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
    : 0;

  const totalPrice = selectedRoom ? selectedRoom.basePrice * nights : 0;

  const setField = useCallback(<K extends keyof GuestForm>(key: K, value: GuestForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  function formatDate(d: Date | null) {
    if (!d) return '';
    return d.toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Clear selected room if capacity exceeded after guest count change
  useEffect(() => {
    if (!selectedRoom) return;
    const maxA = selectedRoom.maxAdults  ?? 99;
    const maxC = selectedRoom.maxChildren ?? 99;
    if (form.adultsCount > maxA || (form.childrenCount > 0 && form.childrenCount > maxC)) {
      setSelectedRoomId('');
    }
  }, [form.adultsCount, form.childrenCount, selectedRoom]);

  // Step 0 validation
  const step0Valid = selectedRoomId && checkIn && checkOut && checkOut > checkIn;

  // Step 1 validation
  const step1Valid = form.firstName && form.lastName && form.email && form.phone &&
    (isTurkish ? form.tcKimlikNo.length === 11 : form.passportNo.length > 0);

  // Step 2 — account requires password match
  const mismatchLabels = getGuestProfileMismatchLabels(accountProfile, form, isTurkish, tr);
  const needsProfileDecision = existingAccountVerified && mismatchLabels.length > 0 && profileDecision === null;

  const step2Valid = emailCheckState === 'exists'
    ? loginPassword.length > 0 && !needsProfileDecision
    : wantsAccount === false || (
        wantsAccount === true &&
        password.length >= 8 &&
        password === passwordConfirm &&
        newAccountProfileOwner !== null
      );

  async function goToStep2() {
    setEmailCheckState('checking');
    setStep(2);
    setLoginPassword('');
    setLoginError(null);
    setExistingAccountVerified(false);
    setAccountProfile(null);
    setProfileDecision(null);
    setNewAccountProfileOwner(null);
    setPasswordResetState('idle');
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(form.email)}`);
      const data = await res.json();
      setEmailCheckState(data.exists ? 'exists' : 'not-exists');
    } catch {
      setEmailCheckState('not-exists');
    }
  }

  async function requestReservationPasswordReset() {
    setPasswordResetState('sending');
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json().catch(() => null);

      setPasswordResetState(response.ok && data?.ok ? 'sent' : 'error');
    } catch {
      setPasswordResetState('error');
    }
  }

  async function handleSubmit() {
    if (!step0Valid || !step1Valid || !step2Valid) return;
    setSubmitting(true);
    setLoginError(null);

    // Mevcut hesap varsa önce giriş doğrulaması yap
    let verifiedProfile = accountProfile;
    if (emailCheckState === 'exists') {
      if (!existingAccountVerified) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: loginPassword }),
        }).catch(() => null);
        const loginData = loginRes ? await loginRes.json().catch(() => null) : null;
        if (!loginData?.ok) {
          setLoginError(loginData?.message ?? (tr ? 'Şifre hatalı.' : 'Incorrect password.'));
          setSubmitting(false);
          return;
        }

        const profileRes = await fetch('/api/auth/me?profile=true').catch(() => null);
        const profileData = profileRes ? await profileRes.json().catch(() => null) : null;
        verifiedProfile = profileData?.user?.profile ?? null;
        setAccountProfile(verifiedProfile);
        setExistingAccountVerified(true);

        const labels = getGuestProfileMismatchLabels(verifiedProfile, form, isTurkish, tr);
        if (labels.length > 0) {
          setProfileDecision(null);
          setSubmitting(false);
          return;
        }
      }

      const labels = getGuestProfileMismatchLabels(verifiedProfile, form, isTurkish, tr);
      if (labels.length > 0 && profileDecision === null) {
        setSubmitting(false);
        return;
      }
    }

    const reservationForm = emailCheckState === 'exists' && profileDecision === 'account' && verifiedProfile
      ? formWithAccountProfile(form, verifiedProfile)
      : form;

    const payload = {
      roomId: selectedRoomId,
      checkInDate: checkIn!.toISOString().split('T')[0],
      checkOutDate: checkOut!.toISOString().split('T')[0],
      adultsCount: reservationForm.adultsCount,
      childrenCount: reservationForm.childrenCount,
      firstName: reservationForm.firstName,
      lastName: reservationForm.lastName,
      email: reservationForm.email,
      phone: reservationForm.phone,
      birthDate: reservationForm.birthDate || undefined,
      gender: reservationForm.gender || undefined,
      nationality: reservationForm.nationality || 'TR',
      tcKimlikNo: isTurkish ? reservationForm.tcKimlikNo : undefined,
      passportNo: !isTurkish ? reservationForm.passportNo : undefined,
      passportExpiry: !isTurkish ? reservationForm.passportExpiry : undefined,
      companyName: showCorporate ? reservationForm.companyName : undefined,
      taxNumber: showCorporate ? reservationForm.taxNumber : undefined,
      taxOffice: showCorporate ? reservationForm.taxOffice : undefined,
      specialRequests: reservationForm.specialRequests || undefined,
    };

    const personPayload = {
      firstName: reservationForm.firstName,
      lastName: reservationForm.lastName,
      email: reservationForm.email,
      phone: reservationForm.phone,
      birthDate: reservationForm.birthDate || undefined,
      gender: reservationForm.gender || undefined,
      nationality: reservationForm.nationality || 'TR',
      tcKimlikNo: isTurkish ? reservationForm.tcKimlikNo : undefined,
      passportNo: !isTurkish ? reservationForm.passportNo : undefined,
      passportExpiry: !isTurkish ? reservationForm.passportExpiry : undefined,
      companyName: showCorporate ? reservationForm.companyName : undefined,
      taxNumber: showCorporate ? reservationForm.taxNumber : undefined,
      taxOffice: showCorporate ? reservationForm.taxOffice : undefined,
    };

    try {
      const resRes = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await resRes.json();

      if (!resData.ok) {
        setResult({ ok: false, message: resData.message });
        setSubmitting(false);
        return;
      }

      let needsProfileSetup = false;

      if (emailCheckState === 'exists' && profileDecision === 'entered') {
        await fetch('/api/account/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...personPayload,
            relation: 'guest',
            isDefault: false,
          }),
        }).catch(() => null);
      }

      // Hesap oluşturma — yalnızca yeni kayıt akışında
      if (wantsAccount === true && emailCheckState !== 'exists') {
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...personPayload,
            password,
            profileOwner: newAccountProfileOwner ?? 'self',
          }),
        }).catch(() => null);
        const registerData = registerRes ? await registerRes.json().catch(() => null) : null;
        needsProfileSetup = !!registerData?.needsProfileSetup;
      }

      setResult({ ok: true, confirmationId: resData.confirmationId, needsProfileSetup });
    } catch {
      setResult({ ok: false, message: tr ? 'Bağlantı hatası.' : 'Connection error.' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Result screen ──────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-center">
        {result.ok ? (
          <>
            <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-brand-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {tr ? 'Rezervasyonunuz Alındı!' : 'Reservation Confirmed!'}
            </h2>
            <p className="text-white/50 text-sm mb-4">
              {tr ? 'Onay kodunuz:' : 'Your confirmation code:'}
            </p>
            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(result.confirmationId!)}&bgcolor=ffffff&color=1c1714&qzone=1&margin=0`}
                alt="QR"
                width={180}
                height={180}
                className="rounded-xl block"
              />
            </div>
            <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-xl px-8 py-4 mb-4">
              <p className="text-brand-accent text-xl font-mono font-bold tracking-widest">
                {result.confirmationId}
              </p>
            </div>
            <p className="text-white/30 text-xs max-w-sm">
              {tr
                ? 'QR kodu veya onay kodunu resepsiyonda göstererek check-in yapabilirsiniz.'
                : 'Show the QR code or confirmation code at reception to check in.'}
            </p>
            {emailCheckState === 'exists' && (
              <p className="mt-4 text-xs text-brand-accent/70">
                {tr
                  ? 'Hesabınıza giriş yapıldı. Rezervasyonlarınızı panelden görebilirsiniz.'
                  : 'You are now logged in. View your reservations from your panel.'}
              </p>
            )}
            {emailCheckState !== 'exists' && wantsAccount === true && (
              <div className="mt-4 text-xs text-brand-accent/70 space-y-2">
                <p>
                  {result.needsProfileSetup
                    ? tr
                      ? 'Hesabınız oluşturuldu. Rezervasyon kişisini hesabınıza ekledik; kendi bilgilerinizi müşteri panelinde tamamlayabilirsiniz.'
                      : 'Your account has been created. We saved the reservation guest to your account; you can complete your own details in your panel.'
                    : tr
                      ? 'Hesabınız oluşturuldu ve bu bilgiler varsayılan profiliniz olarak kaydedildi.'
                      : 'Your account has been created and these details were saved as your default profile.'}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.assign('/musteri')}
                  className="inline-flex rounded-lg bg-brand-accent px-4 py-2 text-[11px] font-bold text-black hover:bg-brand-accent/90 transition-colors"
                >
                  {tr ? 'Müşteri paneline git' : 'Go to customer panel'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {tr ? 'Bir Hata Oluştu' : 'An Error Occurred'}
            </h2>
            <p className="text-white/50 text-sm mb-6">{result.message}</p>
            <button
              onClick={() => setResult(null)}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition-colors"
            >
              {tr ? 'Tekrar Dene' : 'Try Again'}
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Left column — heading */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center h-full space-y-3 shrink-0">
        <div>
          <div className="badge-accent mb-3">
            <Calendar size={12} />
            <span>{tr ? 'Rezervasyon' : 'Reservation'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-[2.8rem] font-medium tracking-tighter leading-none text-white font-sans">
            {tr ? 'Konaklamanızı' : 'Book Your'}
            <br />
            {tr ? 'Hemen' : 'Stay'}
            <br />
            <span className="text-brand-accent">{tr ? 'Rezerve Edin' : 'Right Now'}</span>
          </h1>
        </div>

        {/* Summary card */}
        {selectedRoom && nights > 0 && (
          <div className="max-w-xs bg-black/15 backdrop-blur-md p-4 rounded-xl border border-white/5 space-y-2 shadow-lg">
            <p className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold">
              {tr ? 'Seçilen Oda' : 'Selected Room'}
            </p>
            <p className="text-white font-bold">{selectedRoom.name} — {selectedRoom.roomType.name}</p>
            <div className="text-xs text-white/50 space-y-0.5">
              <p>{formatDate(checkIn)} → {formatDate(checkOut)}</p>
              <p>{nights} {tr ? 'gece' : 'night'} × ₺{selectedRoom.basePrice.toLocaleString('tr-TR')}</p>
            </div>
            <p className="text-brand-accent font-bold text-sm">
              {tr ? 'Toplam:' : 'Total:'} ₺{totalPrice.toLocaleString('tr-TR')}
            </p>
          </div>
        )}
      </div>

      {/* Right column — form */}
      <div className="w-full lg:w-3/5 h-full flex flex-col min-h-0 py-2">
        <div className="bg-black/15 backdrop-blur-md rounded-2xl border border-white/5 p-4 shadow-lg flex flex-col min-h-0 flex-1">
          <StepBar step={step} />

          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Room + Dates ─────────────────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <Field label={tr ? 'Oda Seçin' : 'Select Room'} required>
                  {dateFilterActive && (
                    <p className="text-[10px] text-brand-accent/70 mb-1 flex items-center gap-1">
                      <Check size={10} />
                      {tr ? 'Yalnızca seçili tarihlerde müsait odalar gösteriliyor' : 'Showing only rooms available for selected dates'}
                    </p>
                  )}
                  <div className="relative">
                    <select
                      value={selectedRoomId}
                      onChange={e => setSelectedRoomId(e.target.value)}
                      className={selectCls}
                      disabled={loadingRooms}
                    >
                      <option value="">
                        {loadingRooms
                          ? (tr ? 'Yükleniyor…' : 'Loading…')
                          : capacityFilteredRooms.length === 0
                            ? (tr ? 'Bu kişi sayısına ve tarihlere uygun oda yok' : 'No rooms available for these dates & guest count')
                            : (tr ? 'Oda seçin…' : 'Select a room…')}
                      </option>
                      {capacityFilteredRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} — {r.roomType.name} · ₺{r.basePrice.toLocaleString('tr-TR')}/{tr ? 'gece' : 'night'}
                          {r.floor ? ` (${r.floor}. kat)` : ''}
                          {' · '}{r.maxAdults}{tr ? 'y' : 'a'}{r.maxChildren > 0 ? `+${r.maxChildren}${tr ? 'ç' : 'c'}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </Field>

                {selectedRoom && (
                  <div className="bg-white/3 rounded-lg p-3 text-xs text-white/40 space-y-1">
                    <p className="text-brand-accent/70 font-medium">
                      {tr ? 'Kapasite:' : 'Capacity:'} {selectedRoom.maxAdults} {tr ? 'yetişkin' : 'adult'}
                      {selectedRoom.maxChildren > 0 ? ` + ${selectedRoom.maxChildren} ${tr ? 'çocuk' : 'child'}` : (tr ? ' (çocuk kabul edilmez)' : ' (no children)')}
                    </p>
                    {selectedRoom.description && <p>{selectedRoom.description}</p>}
                    {selectedRoom.roomType.amenities.length > 0 && (
                      <p>{selectedRoom.roomType.amenities.slice(0, 5).join(' · ')}{selectedRoom.roomType.amenities.length > 5 ? ' …' : ''}</p>
                    )}
                  </div>
                )}

                <Field label={tr ? 'Tarih Aralığı' : 'Date Range'} required>
                  <button
                    onClick={() => setShowDatePicker(true)}
                    className={`${inputCls} text-left flex items-center gap-2`}
                  >
                    <Calendar size={14} className="text-white/30 shrink-0" />
                    {checkIn && checkOut ? (
                      <span className="text-white">
                        {formatDate(checkIn)} → {formatDate(checkOut)}
                        <span className="ml-2 text-brand-accent/70 text-xs">({nights} {tr ? 'gece' : 'night'})</span>
                      </span>
                    ) : (
                      <span className="text-white/20">{tr ? 'Giriş ve çıkış tarihi seçin' : 'Select check-in & check-out'}</span>
                    )}
                  </button>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={tr ? 'Yetişkin' : 'Adults'} required>
                    <div className="relative">
                      <select value={form.adultsCount} onChange={e => setField('adultsCount', Number(e.target.value))} className={selectCls}>
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label={tr ? 'Çocuk' : 'Children'}>
                    <div className="relative">
                      <select value={form.childrenCount} onChange={e => setField('childrenCount', Number(e.target.value))} className={selectCls}>
                        {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    disabled={!step0Valid}
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 rounded-lg bg-brand-accent text-black font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent/90 transition-colors"
                  >
                    {tr ? 'Devam Et' : 'Continue'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Guest Info ────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tr ? 'Ad' : 'First Name'} required>
                    <input value={form.firstName} onChange={e => setField('firstName', e.target.value)} className={inputCls} placeholder="Ayşe" />
                  </Field>
                  <Field label={tr ? 'Soyad' : 'Last Name'} required>
                    <input value={form.lastName} onChange={e => setField('lastName', e.target.value)} className={inputCls} placeholder="Yılmaz" />
                  </Field>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="E-posta" required>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className={`${inputCls} pl-8`} placeholder="ayse@ornek.com" />
                    </div>
                  </Field>
                  <Field label={tr ? 'Telefon' : 'Phone'} required>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} className={`${inputCls} pl-8`} placeholder="+90 5xx xxx xx xx" />
                    </div>
                  </Field>
                </div>

                {/* Birth + Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tr ? 'Doğum Tarihi' : 'Date of Birth'}>
                    <button
                      type="button"
                      onClick={() => setShowBirthPicker(true)}
                      className={`${inputCls} text-left flex items-center gap-2`}
                    >
                      <Calendar size={13} className="text-white/30 shrink-0" />
                      {form.birthDate ? (
                        <span className="text-white">
                          {new Date(form.birthDate + 'T12:00:00').toLocaleDateString(tr ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-white/20">{tr ? 'Seçin…' : 'Select…'}</span>
                      )}
                    </button>
                  </Field>
                  <Field label={tr ? 'Cinsiyet' : 'Gender'}>
                    <div className="relative">
                      <select value={form.gender} onChange={e => setField('gender', e.target.value)} className={selectCls}>
                        <option value="">{tr ? 'Belirtmek istemiyorum' : 'Prefer not to say'}</option>
                        <option value="male">{tr ? 'Erkek' : 'Male'}</option>
                        <option value="female">{tr ? 'Kadın' : 'Female'}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {/* ID type toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsTurkish(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isTurkish ? 'bg-brand-accent text-black' : 'bg-white/5 text-white/50 hover:text-white'}`}
                  >
                    {tr ? 'TC Vatandaşı' : 'Turkish Citizen'}
                  </button>
                  <button
                    onClick={() => setIsTurkish(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!isTurkish ? 'bg-brand-accent text-black' : 'bg-white/5 text-white/50 hover:text-white'}`}
                  >
                    {tr ? 'Yabancı Uyruklu' : 'Foreign National'}
                  </button>
                </div>

                {isTurkish ? (
                  <Field label="TC Kimlik No" required>
                    <div className="relative">
                      <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        value={form.tcKimlikNo}
                        onChange={e => setField('tcKimlikNo', e.target.value.replace(/\D/g, '').slice(0, 11))}
                        className={`${inputCls} pl-8`}
                        placeholder="12345678901"
                        maxLength={11}
                      />
                    </div>
                    {form.tcKimlikNo.length > 0 && form.tcKimlikNo.length < 11 && (
                      <p className="text-[10px] text-red-400 mt-0.5">{tr ? '11 haneli olmalı' : 'Must be 11 digits'}</p>
                    )}
                  </Field>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={tr ? 'Pasaport No' : 'Passport No'} required>
                      <div className="relative">
                        <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input value={form.passportNo} onChange={e => setField('passportNo', e.target.value.toUpperCase())} className={`${inputCls} pl-8`} placeholder="A12345678" />
                      </div>
                    </Field>
                    <Field label={tr ? 'Pasaport Son Geçerlilik' : 'Passport Expiry'}>
                      <input type="date" value={form.passportExpiry} onChange={e => setField('passportExpiry', e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                )}

                {!isTurkish && (
                  <Field label={tr ? 'Uyruk' : 'Nationality'}>
                    <input value={form.nationality} onChange={e => setField('nationality', e.target.value.toUpperCase())} className={inputCls} placeholder="DE, FR, US…" maxLength={3} />
                  </Field>
                )}

                {/* Corporate toggle */}
                <button
                  onClick={() => setShowCorporate(p => !p)}
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <Building2 size={12} />
                  {showCorporate
                    ? (tr ? 'Kurumsal bilgileri kaldır' : 'Remove corporate info')
                    : (tr ? 'Kurumsal fatura bilgisi ekle' : 'Add corporate billing info')}
                </button>

                <AnimatePresence>
                  {showCorporate && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-1">
                        <Field label={tr ? 'Şirket Adı' : 'Company Name'}>
                          <input value={form.companyName} onChange={e => setField('companyName', e.target.value)} className={inputCls} placeholder="Örnek A.Ş." />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label={tr ? 'Vergi No' : 'Tax Number'}>
                            <input value={form.taxNumber} onChange={e => setField('taxNumber', e.target.value)} className={inputCls} placeholder="1234567890" />
                          </Field>
                          <Field label={tr ? 'Vergi Dairesi' : 'Tax Office'}>
                            <input value={form.taxOffice} onChange={e => setField('taxOffice', e.target.value)} className={inputCls} placeholder="Kadıköy" />
                          </Field>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Special requests */}
                <Field label={tr ? 'Özel İstekler' : 'Special Requests'}>
                  <textarea
                    value={form.specialRequests}
                    onChange={e => setField('specialRequests', e.target.value)}
                    className={`${inputCls} resize-none h-20`}
                    placeholder={tr ? 'Erken check-in, bebek karyolası, vb.' : 'Early check-in, baby cot, etc.'}
                    maxLength={1000}
                  />
                </Field>

                <div className="flex justify-between pt-2">
                  <button onClick={() => setStep(0)} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors">
                    {tr ? 'Geri' : 'Back'}
                  </button>
                  <button
                    disabled={!step1Valid}
                    onClick={goToStep2}
                    className="px-6 py-2.5 rounded-lg bg-brand-accent text-black font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent/90 transition-colors"
                  >
                    {tr ? 'Devam Et' : 'Continue'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Review + Account upsell ──────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Summary */}
                <div className="bg-white/3 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-brand-accent font-semibold mb-3">
                    <BedDouble size={14} />
                    {tr ? 'Rezervasyon Özeti' : 'Reservation Summary'}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50">
                    <span className="text-white/30">{tr ? 'Oda' : 'Room'}</span>
                    <span className="text-white">{selectedRoom?.name} — {selectedRoom?.roomType.name}</span>
                    <span className="text-white/30">{tr ? 'Giriş' : 'Check-in'}</span>
                    <span className="text-white">{formatDate(checkIn)}</span>
                    <span className="text-white/30">{tr ? 'Çıkış' : 'Check-out'}</span>
                    <span className="text-white">{formatDate(checkOut)}</span>
                    <span className="text-white/30">{tr ? 'Gece' : 'Nights'}</span>
                    <span className="text-white">{nights}</span>
                    <span className="text-white/30">{tr ? 'Misafir' : 'Guests'}</span>
                    <span className="text-white">{form.adultsCount} {tr ? 'yetişkin' : 'adult'}{form.childrenCount > 0 ? `, ${form.childrenCount} ${tr ? 'çocuk' : 'child'}` : ''}</span>
                    <span className="text-white/30">{tr ? 'İsim' : 'Name'}</span>
                    <span className="text-white">{form.firstName} {form.lastName}</span>
                  </div>
                  <div className="border-t border-white/5 mt-3 pt-3 flex justify-between text-sm">
                    <span className="text-white/40">{tr ? 'Toplam Tutar' : 'Total'}</span>
                    <span className="text-brand-accent font-bold text-base">₺{totalPrice.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                {/* E-posta kontrol ediliyor */}
                {emailCheckState === 'checking' && (
                  <div className="flex items-center gap-2 text-white/30 text-xs py-1">
                    <Loader2 size={12} className="animate-spin" />
                    {tr ? 'Hesap kontrol ediliyor…' : 'Checking account…'}
                  </div>
                )}

                {/* Mevcut hesap — giriş yap */}
                {emailCheckState === 'exists' && (
                  <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-brand-accent" />
                      <p className="text-sm font-semibold text-white">
                        {tr ? 'Bu e-posta ile bir hesabınız var' : 'You already have an account'}
                      </p>
                    </div>
                    <p className="text-xs text-white/40">
                      {tr
                        ? 'Rezervasyon hesabınıza bağlansın diye şifrenizi girin.'
                        : 'Enter your password to link this reservation to your account.'}
                    </p>
                    <Field label={tr ? 'Şifreniz' : 'Your Password'} required>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={e => {
                          setLoginPassword(e.target.value);
                          setLoginError(null);
                          setExistingAccountVerified(false);
                          setAccountProfile(null);
                          setProfileDecision(null);
                          setPasswordResetState('idle');
                        }}
                        onKeyDown={e => e.key === 'Enter' && step2Valid && !submitting && handleSubmit()}
                        className={inputCls}
                        placeholder="••••••••"
                        autoFocus
                      />
                    </Field>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={requestReservationPasswordReset}
                        disabled={passwordResetState === 'sending'}
                        className="text-[11px] text-brand-accent/70 hover:text-brand-accent disabled:opacity-50 transition-colors"
                      >
                        {passwordResetState === 'sending'
                          ? tr ? 'Bağlantı gönderiliyor…' : 'Sending link…'
                          : tr ? 'Şifremi unuttum' : 'Forgot password'}
                      </button>
                      {existingAccountVerified && !needsProfileDecision && (
                        <span className="text-[10px] text-emerald-300/80 flex items-center gap-1">
                          <Check size={11} />
                          {tr ? 'Hesap doğrulandı' : 'Account verified'}
                        </span>
                      )}
                    </div>
                    {passwordResetState === 'sent' && (
                      <p className="text-[10px] leading-relaxed text-emerald-300/80">
                        {tr
                          ? 'Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edebilirsiniz.'
                          : 'If this email is registered, a reset link has been sent. Please check your inbox.'}
                      </p>
                    )}
                    {passwordResetState === 'error' && (
                      <p className="text-[10px] text-red-400">
                        {tr ? 'Şu anda sıfırlama bağlantısı gönderilemedi.' : 'The reset link could not be sent right now.'}
                      </p>
                    )}
                    {loginError && (
                      <p className="text-[10px] text-red-400">{loginError}</p>
                    )}
                  </div>
                )}

                {emailCheckState === 'exists' && existingAccountVerified && mismatchLabels.length > 0 && (
                  <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={15} className="text-amber-200 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {tr ? 'Bu rezervasyon farklı bir kişi için olabilir' : 'This stay may be for a different guest'}
                        </p>
                        <p className="text-xs leading-relaxed text-white/55">
                          {tr
                            ? `Hesabınızdaki bilgilerle rezervasyonda yazdıklarınız arasında ${mismatchLabels.join(', ')} alanında fark var. Aile üyesi, ekip arkadaşı ya da başka bir misafir için rezervasyon yapıyorsanız sorun yok; sadece nasıl kaydedelim seçin.`
                            : `Some details differ from your account profile: ${mismatchLabels.join(', ')}. If you are booking for a family member, colleague, or another guest, that is fine; just choose how we should save it.`}
                        </p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setProfileDecision('entered')}
                        className={`rounded-lg px-3 py-2 text-left text-xs border transition-colors ${
                          profileDecision === 'entered'
                            ? 'bg-brand-accent text-black border-brand-accent'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="block font-semibold">
                          {tr ? 'Girilen kişi adına kalsın' : 'Keep entered guest'}
                        </span>
                        <span className={profileDecision === 'entered' ? 'text-black/60' : 'text-white/35'}>
                          {tr ? 'Rezervasyon bu kişiyle hesabınıza bağlanır.' : 'The reservation is linked to your account with this guest.'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileDecision('account')}
                        className={`rounded-lg px-3 py-2 text-left text-xs border transition-colors ${
                          profileDecision === 'account'
                            ? 'bg-brand-accent text-black border-brand-accent'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="block font-semibold">
                          {tr ? 'Hesap bilgilerimi kullan' : 'Use my account details'}
                        </span>
                        <span className={profileDecision === 'account' ? 'text-black/60' : 'text-white/35'}>
                          {tr ? 'Rezervasyon hesabınızdaki kişiyle oluşturulur.' : 'The reservation will use your saved profile.'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Yeni kullanıcı — hesap oluşturmak ister misiniz? */}
                {emailCheckState === 'not-exists' && wantsAccount === null && (
                  <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-brand-accent" />
                      <p className="text-sm font-semibold text-white">
                        {tr ? 'Üye olarak hızlı check-in yapmak ister misiniz?' : 'Want faster check-in with a member account?'}
                      </p>
                    </div>
                    <p className="text-xs text-white/40">
                      {tr
                        ? 'Bilgileriniz kaydedilir, bir sonraki rezervasyonda tekrar doldurmanıza gerek kalmaz.'
                        : 'Your info is saved so you don\'t need to re-enter it next time.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setWantsAccount(true);
                          setNewAccountProfileOwner(null);
                        }}
                        className="flex-1 py-2 rounded-lg bg-brand-accent text-black text-xs font-bold hover:bg-brand-accent/90 transition-colors"
                      >
                        {tr ? 'Evet, hesap oluştur' : 'Yes, create account'}
                      </button>
                      <button
                        onClick={() => {
                          setWantsAccount(false);
                          setNewAccountProfileOwner(null);
                        }}
                        className="flex-1 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {tr ? 'Hayır, devam et' : 'No, continue'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Password fields */}
                {wantsAccount === true && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-brand-accent/70 flex items-center gap-1.5">
                      <Check size={11} />
                      {tr ? 'Şifrenizi belirleyin — hesabınız hazır!' : 'Set your password — account ready!'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={tr ? 'Şifre (min. 8 karakter)' : 'Password (min. 8 chars)'} required>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                      </Field>
                      <Field label={tr ? 'Şifre Tekrar' : 'Confirm Password'} required>
                        <input
                          type="password"
                          value={passwordConfirm}
                          onChange={e => setPasswordConfirm(e.target.value)}
                          className={inputCls}
                          placeholder="••••••••"
                        />
                      </Field>
                    </div>
                    {passwordConfirm && password !== passwordConfirm && (
                      <p className="text-[10px] text-red-400">{tr ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.'}</p>
                    )}
                    {password.length >= 8 && password === passwordConfirm && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <User size={15} className="text-brand-accent mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {tr ? 'Bu bilgiler kime ait?' : 'Who are these details for?'}
                            </p>
                            <p className="text-xs text-white/45 leading-relaxed mt-1">
                              {tr
                                ? 'Hesabınızı doğru başlatmak için bunu bir kez soruyoruz. Rezervasyon sizin adınıza değilse sorun değil; bu kişiyi hesabınızda ayrı bir birey olarak saklarız.'
                                : 'We ask this once to set up your account correctly. If this stay is not for you, no problem; we will save this guest as a separate person in your account.'}
                            </p>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewAccountProfileOwner('self')}
                            className={`rounded-lg px-3 py-2 text-left text-xs border transition-colors ${
                              newAccountProfileOwner === 'self'
                                ? 'bg-brand-accent text-black border-brand-accent'
                                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="block font-semibold">
                              {tr ? 'Bana ait' : 'These are mine'}
                            </span>
                            <span className={newAccountProfileOwner === 'self' ? 'text-black/60' : 'text-white/35'}>
                              {tr ? 'Varsayılan profiliniz bu bilgilerle oluşur.' : 'Your default profile will use these details.'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewAccountProfileOwner('guest')}
                            className={`rounded-lg px-3 py-2 text-left text-xs border transition-colors ${
                              newAccountProfileOwner === 'guest'
                                ? 'bg-brand-accent text-black border-brand-accent'
                                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span className="block font-semibold">
                              {tr ? 'Başka biri adına' : 'For someone else'}
                            </span>
                            <span className={newAccountProfileOwner === 'guest' ? 'text-black/60' : 'text-white/35'}>
                              {tr ? 'Bu kişi kart olarak kaydolur; kendi bilgilerinizi panelde tamamlarsınız.' : 'This guest is saved as a card; you can complete your own details later.'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => { setWantsAccount(null); setPassword(''); setPasswordConfirm(''); setNewAccountProfileOwner(null); }}
                      className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
                    >
                      {tr ? 'Vazgeç, hesap istemiyorum' : 'Never mind, skip account'}
                    </button>
                  </motion.div>
                )}

                {wantsAccount === false && (
                  <p className="text-xs text-white/30 flex items-center gap-1.5">
                    <Check size={11} />
                    {tr ? 'Üyeliksiz devam ediyorsunuz.' : 'Continuing without an account.'}
                    <button onClick={() => setWantsAccount(null)} className="text-brand-accent/60 hover:text-brand-accent transition-colors ml-1">
                      {tr ? 'Değiştir' : 'Change'}
                    </button>
                  </p>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setEmailCheckState('idle');
                      setLoginPassword('');
                      setLoginError(null);
                      setExistingAccountVerified(false);
                      setAccountProfile(null);
                      setProfileDecision(null);
                      setPasswordResetState('idle');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {tr ? 'Geri' : 'Back'}
                  </button>
                  <button
                    disabled={
                      submitting ||
                      !step2Valid ||
                      emailCheckState === 'checking' ||
                      emailCheckState === 'idle' ||
                      (emailCheckState === 'not-exists' && wantsAccount === null)
                    }
                    onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-lg bg-brand-accent text-black font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent/90 transition-colors flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {tr ? 'Rezervasyonu Tamamla' : 'Complete Reservation'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Date picker modal */}
      <AnimatePresence>
        {showDatePicker && (
          <DatePickerModal
            checkIn={checkIn}
            checkOut={checkOut}
            onConfirm={(ci, co) => { setCheckIn(ci); setCheckOut(co); setShowDatePicker(false); fetchRooms(ci, co); }}
            onClose={() => setShowDatePicker(false)}
            tr={tr}
          />
        )}
      </AnimatePresence>

      {/* Birth date picker modal */}
      <AnimatePresence>
        {showBirthPicker && (
          <SingleDatePickerModal
            value={form.birthDate ? new Date(form.birthDate + 'T12:00:00') : null}
            maxDate={startOfDay(new Date())}
            onConfirm={d => {
              const yyyy = d.getFullYear();
              const mm   = String(d.getMonth() + 1).padStart(2, '0');
              const dd   = String(d.getDate()).padStart(2, '0');
              setField('birthDate', `${yyyy}-${mm}-${dd}`);
              setShowBirthPicker(false);
            }}
            onClose={() => setShowBirthPicker(false)}
            tr={tr}
            label={tr ? 'Doğum Tarihi' : 'Date of Birth'}
          />
        )}
      </AnimatePresence>
    </>
  );
}
