'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'motion/react';
import {
  Star, Sparkles, ShieldCheck,
  Compass, MessageSquare, Send, CheckCircle2, ChevronLeft, ChevronRight,
  MapPin, Mail, Phone, Lock, Eye, CalendarCheck, HelpCircle, Flame, Droplets, Fan,
  Leaf, Menu, BedDouble, Wifi, Coffee, Clock, UserCircle2,
} from 'lucide-react';
import { reviews as initialReviews } from './data';
import { Review } from './types';
import { LoginModal } from './components/auth/LoginModal';
import { RoomsScreen } from './components/RoomsScreen';
import { AtmosphereScreen } from './components/AtmosphereScreen';
import { ReservationScreen } from './components/ReservationScreen';
import { useLanguage } from './i18n/LanguageContext';

type ScreenType = 'locations' | 'rooms' | 'reserve' | 'atmosphere' | 'experiences' | 'contact';
const SCREENS: ScreenType[] = ['locations', 'rooms', 'reserve', 'atmosphere', 'experiences', 'contact'];

const TARGET_TIME_RATIOS: Record<ScreenType, number> = {
  locations: 0,
  rooms: 0.17,
  reserve: 0.33,
  atmosphere: 0.50,
  experiences: 0.67,
  contact: 0.83,
};

interface PublicReviewSummary {
  source: 'google' | 'dummy';
  enabled: boolean;
  rating: number;
  count: number;
  labelTr: string;
  labelEn: string;
}

const screenVariants: Variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: (direction: number) => ({
    y: direction < 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.4, ease: "easeOut" }
  })
};

export default function App() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  // Screen names supporting navigation specs
  const [screen, setScreenState] = useState<ScreenType>('locations');
  const screenRef = useRef<ScreenType>('locations');
  const [direction, setDirection] = useState(0);
  const isScrollingRef = useRef(false);
  const targetTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const setScreen = (newScreen: ScreenType) => {
    const currentIndex = SCREENS.indexOf(screenRef.current);
    const nextIndex = SCREENS.indexOf(newScreen);
    if (currentIndex === nextIndex) return;
    setDirection(nextIndex > currentIndex ? 1 : -1);
    screenRef.current = newScreen;
    setScreenState(newScreen);
  };
  
  // Peak occupants loading state counter
  const [count, setCount] = useState(0);

  // Public review showcase state
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewSummary, setReviewSummary] = useState<PublicReviewSummary>({
    source: 'dummy',
    enabled: false,
    rating: 4.8,
    count: 99,
    labelTr: 'Misafir Memnuniyeti',
    labelEn: 'Guest Satisfaction',
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const reviewStats = useMemo(() => {
    const sourceReviews = reviews.length > 0 ? reviews : initialReviews;
    const total = sourceReviews.length;
    const average = total > 0
      ? sourceReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : reviewSummary.rating;

    return {
      total,
      average,
      distribution: [5, 4, 3].map((star) => {
        const countForStar = sourceReviews.filter((review) => Math.round(review.rating) === star).length;
        return {
          star,
          percent: total > 0 ? Math.round((countForStar / total) * 100) : 0,
        };
      }),
    };
  }, [reviews, reviewSummary.rating]);

  // Contact/Concierge status state
  const [contactName, setContactName] = useState('');
  const [contactCategory, setContactCategory] = useState('Rezervasyon & Giriş');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');
  const [isContactSending, setIsContactSending] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ roleSlug: string; email: string } | null>(null);

  // Returning from a top-level 3DS payment redirect (/?payment=<id>) opens the
  // reservation screen so ReservationScreen can show the in-app confirmation.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('payment')) {
      setScreen('reserve');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.ok) setSessionUser({ roleSlug: data.user.roleSlug, email: data.user.email }); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch('/api/public/reviews')
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok) return;
        if (payload.summary) setReviewSummary(payload.summary);
        if (Array.isArray(payload.reviews) && payload.reviews.length > 0) {
          setReviews(payload.reviews.map((item: {
            id: string;
            userName: string;
            rating: number;
            date: string;
            comment: string;
          }) => ({
            id: item.id,
            userName: item.userName,
            rating: item.rating,
            date: item.date,
            comment: item.comment,
            avatarUrl: '',
          })));
        }
      })
      .catch(() => undefined)
      .finally(() => setReviewsLoading(false));
  }, []);

  // Disable background scrolling when login modal is open
  const isModalOpen = isLoginOpen;
  const isModalOpenRef = useRef(isModalOpen);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Video scrubbing reference and logic
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video smooth scrubbing based on screen
  useEffect(() => {
    if (!videoRef.current) return;
    
    const updateTargetTime = () => {
      if (!videoRef.current || Number.isNaN(videoRef.current.duration)) return;
      targetTimeRef.current = videoRef.current.duration * TARGET_TIME_RATIOS[screen];
    };
    
    videoRef.current.addEventListener('loadedmetadata', updateTargetTime);
    updateTargetTime();
    
    const animateVideo = () => {
      if (videoRef.current && !Number.isNaN(videoRef.current.duration)) {
        const current = videoRef.current.currentTime;
        const target = targetTimeRef.current;
        const diff = target - current;
        
        if (Math.abs(diff) > 0.01) {
          videoRef.current.currentTime = current + diff * 0.05;
        }
      }
      rafRef.current = requestAnimationFrame(animateVideo);
    };
    
    rafRef.current = requestAnimationFrame(animateVideo);
    
    return () => {
      if (videoRef.current) videoRef.current.removeEventListener('loadedmetadata', updateTargetTime);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screen]);

  // Scroll-jacking for screens
  useEffect(() => {
    let lastTouchY = 0;

    const navigateTo = (dir: 1 | -1) => {
      if (isScrollingRef.current || isModalOpenRef.current) return;
      
      const currentIndex = SCREENS.indexOf(screenRef.current);
      const nextIndex = currentIndex + dir;
      
      if (nextIndex >= 0 && nextIndex < SCREENS.length) {
        isScrollingRef.current = true;
        setDirection(dir);
        
        const nextScreen = SCREENS[nextIndex];
        screenRef.current = nextScreen;
        setScreenState(nextScreen);
        
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1200);
      }
    };

    // If the pointer is over an internal scroll area, keep all wheel/touch
    // movement there. Reaching the edge should not trigger a screen change.
    function isConsumedByScrollable(target: EventTarget | null): boolean {
      let el = target as Element | null;
      while (el && el !== document.documentElement) {
        if (el.hasAttribute('data-scroll-lock')) return true;
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          if (el.scrollHeight > el.clientHeight + 1) return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 30) return;
      if (isConsumedByScrollable(e.target)) return;
      navigateTo(e.deltaY > 0 ? 1 : -1);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY;

      if (Math.abs(deltaY) > 40) {
        if (isConsumedByScrollable(e.target)) return;
        navigateTo(deltaY > 0 ? 1 : -1);
        lastTouchY = currentTouchY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Occupancy counter ticking on active cabin or tab shift
  useEffect(() => {
    let start = 0;
    const end = 82;
    setCount(0);
    const totalDuration = 1000;
    const incrementTime = Math.abs(Math.floor(totalDuration / end));

    const timer = setInterval(() => {
      start += 1.3;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [screen]);

  const handleContactDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) return;

    setIsContactSending(true);
    setContactSuccess(true);
    setContactError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          category: contactCategory,
          message: contactMessage,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Contact request failed.');
      }

      alert(`Mesajınız iletildi. Referans: ${payload.ticketId}.`);
      setContactName('');
      setContactMessage('');
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Message could not be sent.');
    } finally {
      setContactSuccess(false);
      setIsContactSending(false);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] text-white flex items-center justify-center p-0 md:p-4 lg:p-4 select-none overflow-hidden font-sans bg-[#070f12]">
      
      {/* Scroll-Responsive Background Video */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <video
          ref={videoRef}
          src="/background-video.mp4"
          playsInline
          muted
          preload="auto"
          className="w-full h-full object-cover filter brightness-[0.7] saturate-[1.1] select-none pointer-events-none"
        />
      </div>

      {/* Main Glass Frame Shell */}
      <div className="w-full max-w-[1440px] h-full glass-frame relative flex flex-col justify-between z-20 overflow-hidden md:border border-white/20 md:shadow-2xl md:rounded-[2rem]">
        
        {/* Navigation Header strictly matching Navigation Flow specs */}
        <nav className="nav-glass">
          
          {/* Logo */}
          <div
            onClick={() => setScreen('locations')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-white overflow-hidden shrink-0 shadow-sm">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'left center' }}
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent select-none">
              KÃ¼tahya Garden Otel
            </span>
          </div>

          {/* Right side Container (Nav Links + Action buttons) */}
          <div className="flex items-center gap-6">
            
            {/* Navigation links */}
            <ul className="hidden lg:flex items-center gap-1.5 bg-black/25 p-1 rounded-full border border-white/5">
              {SCREENS.map(s => (
                <li key={s} className="list-none">
                  <button
                    onClick={() => setScreen(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                      screen === s 
                        ? 'bg-white text-black' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t(`nav.${s}`)}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-0.5">
                <button
                  onClick={() => setLanguage('tr')}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                    language === 'tr' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'
                  }`}
                >
                  TR
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                    language === 'en' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Login / User panel button */}
              {sessionUser ? (
                <button
                  onClick={() => router.push(`/${sessionUser.roleSlug}`)}
                  title={sessionUser.email}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-md border border-white/20"
                >
                  <UserCircle2 size={17} className="text-brand-accent" />
                  <span className="hidden sm:inline text-xs text-white/70 max-w-[120px] truncate">
                    {sessionUser.email.split('@')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-white/10 hover:bg-white text-white hover:text-black px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-md border border-white/20"
                >
                  {t('nav.login')}
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Unified Subscreen Left/Right Columns Body */}
        <div className="flex-1 relative min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.main
              key={screen}
              custom={direction}
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex-1 flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-12 py-0 sm:py-2 lg:py-2 gap-4 sm:gap-6 lg:gap-6 w-full h-full overflow-hidden"
            >

              {/* ==================== SCREEN 1: LOCATIONS ==================== */}
              {screen === 'locations' && (
                <>
                  {/* Left Column */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-4 lg:space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3.5 py-1 text-[11px] font-medium border border-white/20 mb-4">
                        <MapPin size={12} />
                        <span>{t('loc.badge')}</span>
                      </div>

                      <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-tighter leading-none mb-6 text-white text-shadow-sm font-sans">
                        {t('loc.title1')}
                        <br />
                        <span className="text-white/80">{t('loc.title2')}</span>
                        <br />
                        {t('loc.title3')}
                      </h1>

                      <p className="text-sm sm:text-base text-white/90 max-w-sm leading-relaxed font-light drop-shadow-md">
                        {t('loc.desc')}
                      </p>
                    </div>

                    {/* Hotel highlights */}
                    <div className="max-w-md bg-black/15 backdrop-blur-md p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-3 shadow-lg">
                      {[
                        { icon: <Clock size={13} className="text-brand-accent" />, label: language === 'tr' ? 'Check-in' : 'Check-in', value: '14:00 →' },
                        { icon: <Clock size={13} className="text-brand-accent" />, label: language === 'tr' ? 'Check-out' : 'Check-out', value: '← 12:00' },
                        { icon: <Wifi size={13} className="text-brand-accent" />, label: language === 'tr' ? 'İnternet' : 'Internet', value: language === 'tr' ? 'Ücretsiz Wi-Fi' : 'Free Wi-Fi' },
                        { icon: <Coffee size={13} className="text-brand-accent" />, label: language === 'tr' ? 'Kahvaltı' : 'Breakfast', value: language === 'tr' ? 'Seçenek Mevcut' : 'Option Available' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-white/3 rounded-lg">
                          <div className="mt-0.5">{item.icon}</div>
                          <div>
                            <p className="text-[9px] text-white/35 uppercase tracking-wider font-medium">{item.label}</p>
                            <p className="text-xs text-white/80 font-medium">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column — CTA card */}
                  <div className="w-full lg:w-[400px] flex items-center justify-center h-full">
                    <div className="panel-glass p-5 sm:p-6 w-full flex flex-col gap-4 shadow-2xl">
                      <div>
                        <span className="label-accent">{language === 'tr' ? 'Konaklama' : 'Accommodation'}</span>
                        <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                          {t('loc.title1')} {t('loc.title2')}
                        </h2>
                        <p className="text-xs text-white/50 mt-0.5">{t('loc.remoteLocation')}</p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { icon: <BedDouble size={13} />, text: language === 'tr' ? '10 oda, 4 farklı oda çeşidi' : '10 rooms, 4 room types' },
                          { icon: <MapPin size={13} />, text: language === 'tr' ? 'Kütahya şehir merkezinde' : 'Kütahya city center' },
                          { icon: <ShieldCheck size={13} />, text: language === 'tr' ? '7/24 resepsiyon hizmeti' : '24/7 reception service' },
                          { icon: <Coffee size={13} />, text: language === 'tr' ? 'Kahvaltı dahil seçeneği' : 'Breakfast option available' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-white/60">
                            <span className="text-brand-accent/70">{item.icon}</span>
                            {item.text}
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
                        <button
                          onClick={() => setScreen('reserve')}
                          className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold"
                        >
                          {language === 'tr' ? 'Hemen Rezervasyon Yap' : 'Book Now'}
                        </button>
                        <button
                          onClick={() => setScreen('rooms')}
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {language === 'tr' ? 'Odaları İncele' : 'Browse Rooms'}
                        </button>
                      </div>

                      <div className="flex justify-between text-[10px] text-white/30 border-t border-white/5 pt-3">
                        <span>{language === 'tr' ? `Check-in: ${t('loc.after2pm')}` : `Check-in after ${t('loc.after2pm')}`}</span>
                        <span>{language === 'tr' ? `Check-out: ${t('loc.before12pm')}` : `Check-out before ${t('loc.before12pm')}`}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* ==================== SCREEN 2: ROOMS ==================== */}
              {screen === 'rooms' && <RoomsScreen />}

              {/* ==================== SCREEN 3: RESERVE ==================== */}
              {screen === 'reserve' && <ReservationScreen />}

              {/* ==================== SCREEN 4: ATMOSPHERE ==================== */}
              {screen === 'atmosphere' && <AtmosphereScreen />}


              {/* ==================== SCREEN 3: EXPERIENCES ==================== */}
              {screen === 'experiences' && (
                <>
                  {/* Left Column Section: Matching Layout structure precisely */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-3 lg:space-y-3">
                    <div>
                      <div className="badge-accent mb-3">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>{t('exp.badge')}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-5xl lg:text-[3.05rem] xl:text-[3.35rem] font-medium tracking-tighter leading-none text-white font-sans">
                        {t('exp.title1')}
                        <br />
                        {t('exp.title2')}
                        <br />
                        <span className="text-brand-accent">{t('exp.title3')}</span>
                      </h1>
                    </div>

                    {/* Public review showcase */}
                    <div data-scroll-lock className="max-w-md bg-black/15 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/5 space-y-2.5 shadow-lg overflow-hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="label-accent font-mono">
                            {language === 'tr' ? 'MİSAFİR YORUMLARI' : 'GUEST REVIEWS'}
                          </span>
                          <h3 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                            {language === 'tr' ? 'KÃ¼tahya Garden Otel deneyimi' : 'KÃ¼tahya Garden Otel experience'}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/20 px-2.5 py-1 font-mono text-sm font-bold text-amber-300">
                            <Star size={13} className="fill-amber-300" />
                            {reviewSummary.rating.toFixed(1)}
                          </div>
                          <p className="mt-1 text-[10px] text-white/45">
                            {reviewSummary.source === 'google'
                              ? (language === 'tr' ? 'Google puanı' : 'Google rating')
                              : (language === 'tr' ? 'Demo puan' : 'Demo rating')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/35">
                            {language === 'tr' ? 'Kaynak' : 'Source'}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-white">
                            {language === 'tr' ? reviewSummary.labelTr : reviewSummary.labelEn}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/35">
                            {language === 'tr' ? 'Memnuniyet' : 'Satisfaction'}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-white">
                            {reviewSummary.source === 'google'
                              ? `${reviewSummary.count.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} ${language === 'tr' ? 'değerlendirme' : 'reviews'}`
                              : `${reviewSummary.count}% ${language === 'tr' ? 'misafir önerisi' : 'guest approval'}`}
                          </p>
                        </div>
                      </div>

                      <div className="max-h-[155px] space-y-2 overflow-y-auto overscroll-contain border-t border-white/10 pt-2.5 pr-2 md:max-h-[175px] xl:max-h-[205px]">
                        {reviewsLoading ? (
                          <div className="py-6 text-center text-xs text-white/45">
                            {language === 'tr' ? 'Yorumlar yükleniyor…' : 'Loading reviews…'}
                          </div>
                        ) : reviews.map((review) => {
                          const parsedDate = Date.parse(review.date);
                          const reviewDate = Number.isNaN(parsedDate)
                            ? review.date
                            : new Date(parsedDate).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });

                          return (
                            <div key={review.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                              <div className="mb-1.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                      key={index}
                                      size={11}
                                      className={index < Math.round(review.rating) ? 'fill-brand-accent text-brand-accent' : 'text-white/25'}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-white/35">{reviewDate}</span>
                              </div>
                              <p className="line-clamp-2 text-xs leading-relaxed text-white/75">"{review.comment}"</p>
                              <p className="mt-2 text-[11px] font-semibold text-white/80">{review.userName}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Trust summary supporting guest reviews */}
                  <div className="w-full lg:w-[410px] flex h-full items-center justify-center">
                    <div data-scroll-lock className="panel-glass p-3.5 w-full max-h-[calc(100dvh-260px)] overflow-hidden flex flex-col gap-2.5 shadow-2xl relative">
                      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="label-accent font-mono">
                              {language === 'tr' ? 'YORUMLARIN ÖZETİ' : 'REVIEW SNAPSHOT'}
                            </span>
                            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5 leading-tight">
                              {language === 'tr' ? 'Misafirler en çok neyi seviyor?' : 'What guests mention most'}
                            </h2>
                            <p className="text-[11px] text-white/50 leading-relaxed">
                              {language === 'tr'
                                ? 'Public yorumlar ve otel içi geri bildirimlerden kısa bir tablo.'
                                : 'A quick read from public and in-house guest feedback.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                          <div className="grid size-16 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/15">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-xl font-black text-amber-200">
                                <Star size={14} className="fill-amber-200" />
                                {reviewSummary.rating.toFixed(1)}
                              </div>
                              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/45">/ 5</p>
                            </div>
                          </div>
                          <div className="min-w-0 self-center">
                            <p className="text-xs font-bold text-white">
                              {reviewSummary.source === 'google'
                                ? (language === 'tr' ? 'Google değerlendirmeleri aktif' : 'Google reviews enabled')
                                : (language === 'tr' ? 'Demo puan + iç yorumlar' : 'Demo score + in-house reviews')}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                              {language === 'tr'
                                ? `${reviewStats.total} yorum kartı gösteriliyor. Onay bekleyen yorumlar public alana çıkmıyor.`
                                : `${reviewStats.total} review cards are shown. Pending reviews stay private.`}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/10 p-3">
                          {reviewStats.distribution.map((item) => (
                            <div key={item.star} className="grid grid-cols-[42px_1fr_34px] items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 font-bold text-white/75">
                                {item.star}
                                <Star size={10} className="fill-brand-accent text-brand-accent" />
                              </span>
                              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-brand-accent"
                                  style={{ width: `${Math.max(item.percent, item.percent > 0 ? 8 : 0)}%` }}
                                />
                              </div>
                              <span className="text-right font-mono text-[10px] text-white/45">%{item.percent}</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            {
                              Icon: MapPin,
                              tr: 'Merkez ve kafelere yürüme mesafesi',
                              en: 'Walkable city-center location',
                            },
                            {
                              Icon: BedDouble,
                              tr: 'Oda konforu ve temizlik öne çıkıyor',
                              en: 'Room comfort and cleanliness stand out',
                            },
                            {
                              Icon: ShieldCheck,
                              tr: 'Yayınlanan yorumlar admin onayından geçiyor',
                              en: 'Published in-house reviews are moderated',
                            },
                          ].map(({ Icon, tr, en }) => (
                            <div key={tr} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                              <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand-accent/25 bg-brand-accent/10 text-brand-accent">
                                <Icon size={14} />
                              </div>
                              <p className="text-[11px] font-semibold leading-snug text-white/75">
                                {language === 'tr' ? tr : en}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 space-y-2 border-t border-white/10 pt-2.5">
                        <button
                          onClick={() => setScreen('rooms')}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand-accent px-4 text-sm font-semibold leading-none text-brand-emerald shadow-lg transition-colors hover:brightness-105 active:scale-[0.99]"
                        >
                          {language === 'tr' ? 'Odaları İncele' : 'Browse Rooms'}
                        </button>
                        <button
                          onClick={() => setScreen('reserve')}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold leading-none text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {language === 'tr' ? 'Rezervasyon Yap' : 'Make a Reservation'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* ==================== SCREEN 4: CONTACT ==================== */}
              {screen === 'contact' && (
                <>
                  {/* Left Column Section: Matching Layout structure precisely */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-4 lg:space-y-4">
                    <div>
                      <div className="badge-accent mb-4">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>{t('contact.badge')}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[3.5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        {t('contact.title1')}
                        <br />
                        {t('contact.title2')}
                        <br />
                        <span className="text-brand-accent">{t('contact.title3')}</span>
                      </h1>
                    </div>

                    {/* GPS coordinates & off-grid self check-in assistance guidelines */}
                    <div className="max-w-md bg-black/15 backdrop-blur-md p-4 rounded-xl border border-white/5 space-y-3 shadow-lg">
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                        {t('contact.desc')}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/10 pt-3 text-white/80">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-brand-accent tracking-widest uppercase font-mono mb-1 font-semibold">{t('contact.activeCoord')}</span>
                          <span>39.4242° K, 29.9835° D</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-brand-accent tracking-widest uppercase font-mono mb-1 font-semibold">{t('contact.inbound')}</span>
                          <span>info@gardenhotel.com.tr</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Dynamic Inbound Contact Form matching identical Reservation structure layout */}
                  <div className="w-full lg:w-[410px] items-center">
                    <form onSubmit={handleContactDispatch} className="panel-glass p-4 w-full flex flex-col gap-3 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="label-accent font-mono">{t('contact.secureInquire')}</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            {t('contact.panel')}
                          </h2>
                          <p className="text-xs text-white/50">{t('contact.satellite')}</p>
                        </div>
                      </div>

                      {/* Inputs styled perfectly matching theme input inputs */}
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <span className="label-sm font-mono">{t('contact.yourName')}</span>
                          <input 
                            type="text" 
                            required 
                            placeholder={t('contact.placeholderName2')} 
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="input-base text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="label-sm font-mono">{t('contact.topic')}</span>
                          <select 
                            value={contactCategory}
                            onChange={(e) => setContactCategory(e.target.value)}
                            className="input-base text-xs cursor-pointer"
                          >
                            <option value="Rezervasyon & Giriş">{t('contact.topicOpt1')}</option>
                            <option value="Oda Tipleri & Fiyatlar">{t('contact.topicOpt2')}</option>
                            <option value="Özel İstekler / Şikayetler">{t('contact.topicOpt3')}</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="label-sm font-mono">{t('contact.message')}</span>
                          <textarea 
                            required 
                            rows={3}
                            placeholder={t('contact.placeholderMsg')} 
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="input-base text-xs resize-none min-h-[100px]"
                          />
                        </div>
                      </div>

                      {contactSuccess && (
                        <div className="text-[10px] text-emerald-300 flex items-center gap-1.5 py-0.5 animate-pulse">
                          <CheckCircle2 size={12} />
                          <span>{t('contact.success')}</span>
                        </div>
                      )}

                      {contactError && (
                        <div className="text-[10px] text-red-300 flex items-center gap-1.5 py-0.5">
                          <span>{contactError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isContactSending}
                        className="btn-primary w-full py-3.5 rounded-xl text-xs flex justify-center items-center gap-2"
                      >
                        {isContactSending ? t('contact.dispatching') : (
                          <>
                            <Send size={14} />
                            <span>{t('contact.dispatch')}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}

            </motion.main>
          </AnimatePresence>
        </div>

        {/* Dynamic footer status bar indicator preserving locations screen visual 100% */}
        <div className="flex justify-between items-center p-4 sm:px-8 sm:py-3 bg-surface-glass divider-subtle text-xs text-text-faint font-mono z-20">
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('global.activeGrid')}</span>
          </div>

          {/* Occupancy dynamic gauge with same layout size */}
          <div className="flex items-center gap-4">
              <span className="text-white font-sans text-3xl sm:text-[3rem] opacity-40 font-bold leading-none tracking-tight">
              {count}%
            </span>
            <div className="text-left leading-normal">
              <span className="text-[10px] text-brand-accent font-semibold block uppercase tracking-wider">{t('global.occupancy')}</span>
              <span className="text-[10px] text-white/55">{t('global.season')}</span>
            </div>
          </div>
        </div>

      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(user, redirectTo) => {
          setIsLoginOpen(false);
          router.push(redirectTo);
          router.refresh();
        }}
      />

    </div>
  );
}
