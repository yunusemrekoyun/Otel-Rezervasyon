'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'motion/react';
import {
  Star, Calendar, Sparkles, ShieldCheck,
  Compass, MessageSquare, Send, CheckCircle2, ChevronLeft, ChevronRight,
  MapPin, Mail, Phone, Lock, Eye, CalendarCheck, HelpCircle, Flame, Droplets, Fan,
  Leaf, Menu, BedDouble, Wifi, Coffee, Clock, UserCircle2,
} from 'lucide-react';
import { experiencesData, reviews as initialReviews } from './data';
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

  // Review & Guest diary state
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Experiences tab state
  const [selectedExpId, setSelectedExpId] = useState('kayaking');
  const currentExp = experiencesData.find(e => e.id === selectedExpId) || experiencesData[0];
  const [expGuests, setExpGuests] = useState(2);
  const [expDay, setExpDay] = useState(14);
  const [experienceSubmitting, setExperienceSubmitting] = useState(false);

  // Contact/Concierge status state
  const [contactName, setContactName] = useState('');
  const [contactCategory, setContactCategory] = useState('Check-in Guidelines');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');
  const [isContactSending, setIsContactSending] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ roleSlug: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.ok) setSessionUser({ roleSlug: data.user.roleSlug, email: data.user.email }); })
      .catch(() => null);
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

    // Check if the event target sits inside a scrollable element that hasn't
    // reached its limit in the scroll direction yet. If so, let the inner
    // element consume the scroll — don't hijack to next screen.
    function isConsumedByScrollable(target: EventTarget | null, deltaY: number): boolean {
      let el = target as Element | null;
      while (el && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          const canScrollDown = el.scrollHeight > el.clientHeight + 1;
          if (deltaY > 0 && canScrollDown && el.scrollTop < el.scrollHeight - el.clientHeight - 1) return true;
          if (deltaY < 0 && el.scrollTop > 1) return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 30) return;
      if (isConsumedByScrollable(e.target, e.deltaY)) return;
      navigateTo(e.deltaY > 0 ? 1 : -1);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY;

      if (Math.abs(deltaY) > 40) {
        if (isConsumedByScrollable(e.target, deltaY)) return;
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

  const handleReviewInscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const diaryEntry: Review = {
      id: `review-${Date.now()}`,
      userName: newReviewAuthor.trim(),
      comment: newReviewComment.trim(),
      rating: newReviewRating,
      date: 'May 2026',
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?q=80&w=100&auto=format&fit=crop`
    };

    setReviews([diaryEntry, ...reviews]);
    setNewReviewAuthor('');
    setNewReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3500);
  };

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

      alert(`Message dispatched to Garden Hotel hosts. Reference: ${payload.ticketId}. Secure fallback copy queued to YunusemreKoyun26@gmail.com.`);
      setContactName('');
      setContactMessage('');
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Message could not be sent.');
    } finally {
      setContactSuccess(false);
      setIsContactSending(false);
    }
  };

  const handleExperienceBooking = async () => {
    setExperienceSubmitting(true);

    try {
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceId: currentExp.id,
          day: expDay,
          guests: expGuests,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Experience request failed.');
      }

      alert(`Request submitted for ${currentExp.name} on May ${expDay}. Reference: ${payload.confirmationId}.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Experience request could not be sent.');
    } finally {
      setExperienceSubmitting(false);
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
              Garden Hotel
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
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-4 lg:space-y-4">
                    <div>
                      <div className="badge-accent mb-4">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>{t('exp.badge')}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[3.5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        {t('exp.title1')}
                        <br />
                        {t('exp.title2')}
                        <br />
                        <span className="text-brand-accent">{t('exp.title3')}</span>
                      </h1>
                    </div>

                    {/* Interactive Experiences Selector and dynamic highlights */}
                    <div className="max-w-md bg-black/15 backdrop-blur-md p-4 rounded-xl border border-white/5 space-y-3 shadow-lg">
                      <div className="flex gap-2">
                        {experiencesData.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => setSelectedExpId(e.id)}
                            className={`flex-1 text-[10px] font-semibold tracking-wider uppercase py-2 px-1 rounded-lg border transition-all ${
                              selectedExpId === e.id 
                                ? 'bg-brand-accent text-brand-emerald border-brand-accent' 
                                : 'bg-surface-glass border-border-glass hover:bg-surface-glass-hover text-text-secondary hover:text-white'
                            }`}
                          >
                            {t(`exp.${e.id}.name`).split(' ')[0]} / {t(`exp.${e.id}.name`).split(' ').slice(1).join(' ')}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm text-white">{t(`exp.${currentExp.id}.name`)}</h3>
                          <span className="text-xs text-brand-accent font-semibold">{t(`exp.${currentExp.id}.duration`)}</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed font-light">
                          {t(`exp.${currentExp.id}.desc`)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-amber-400/25 border border-amber-400/40 rounded px-2 py-0.5 text-amber-300 font-mono text-xs font-semibold">
                            ★ {currentExp.rating}
                          </div>
                          <span className="text-xs text-white/60 font-medium">99% {t('exp.recommendation')}</span>
                        </div>
                        <span className="text-xs text-white/40">{t('exp.includesGear')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Custom Experience Planning Card matching reservation structure */}
                  <div className="w-full lg:w-[410px] items-center">
                    <div className="panel-glass p-4 w-full flex flex-col gap-3 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="label-accent font-mono">{t('exp.planner')}</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            {t(`exp.${currentExp.id}.name`)}
                          </h2>
                          <p className="text-xs text-white/50">{t('exp.guided')}</p>
                        </div>
                      </div>

                      {/* Custom selectors aligned nicely to original picker slots */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div 
                          onClick={() => setExpDay(prev => Math.max(1, prev - 1))}
                          className="panel-card"
                        >
                          <span className="label-sm mb-1">{t('exp.targetDate')}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-brand-accent" />
                              <span className="font-semibold text-sm">{t('loc.may')} {expDay}</span>
                            </div>
                            <span className="text-[10px] text-white/40">▼</span>
                          </div>
                        </div>

                        <div 
                          onClick={() => setExpGuests(prev => Math.min(6, prev + 1))}
                          className="panel-card-sm"
                        >
                          <span className="label-sm mb-1">{t('exp.activitySize')}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">{expGuests} {t('exp.attendees')}</span>
                            </div>
                            <span className="text-[10px] text-white/40">▲</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface-glass rounded-card p-3 border border-border-subtle space-y-1.5 text-xs text-text-secondary">
                        <div className="flex justify-between">
                          <span>{t('exp.baseFee')}</span>
                          <span>${currentExp.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('exp.insurance')}</span>
                          <span>$15</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
                          <span>{t('exp.subtotal')}</span>
                          <span className="text-brand-accent">${(currentExp.price + 15) * expGuests}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-white/50">
                        <span>{t('exp.ranger')}</span>
                        <span>{t('exp.briefing')}</span>
                      </div>

                      <button
                        onClick={handleExperienceBooking}
                        disabled={experienceSubmitting}
                        className="w-full bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shimmer-btn shadow-lg cursor-pointer text-center"
                      >
                        {experienceSubmitting ? t('exp.securingBtn') : `${t('exp.secureBtn')}${(currentExp.price + 15) * expGuests}`}
                      </button>
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
                          <span>60.1132° N, 6.0124° E</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-brand-accent tracking-widest uppercase font-mono mb-1 font-semibold">{t('contact.inbound')}</span>
                          <span>YunusemreKoyun26@gmail.com</span>
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
                            <option value="Check-in Guidelines">{t('contact.topicOpt1')}</option>
                            <option value="Cabin upgrades">{t('contact.topicOpt2')}</option>
                            <option value="Solar protocol & Heating">{t('contact.topicOpt3')}</option>
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
