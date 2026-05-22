'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  Star, Pencil, Calendar, Sparkles, Navigation, Heart, ShieldCheck, 
  Compass, MessageSquare, Send, CheckCircle2, ChevronLeft, ChevronRight, 
  MapPin, Mail, Phone, Lock, Eye, CalendarCheck, HelpCircle, Flame, Droplets, Fan,
  Leaf, Menu
} from 'lucide-react';
import { cabins, experiencesData, reviews as initialReviews } from './data';
import { Cabin, Review } from './types';
import { BookingModal } from './components/BookingModal';
import { LoginModal } from './components/auth/LoginModal';
import { useLanguage } from './i18n/LanguageContext';

type ScreenType = 'locations' | 'rooms' | 'atmosphere' | 'experiences' | 'contact';
const SCREENS: ScreenType[] = ['locations', 'rooms', 'atmosphere', 'experiences', 'contact'];

const TARGET_TIME_RATIOS: Record<ScreenType, number> = {
  locations: 0,
  rooms: 0.20,
  atmosphere: 0.40,
  experiences: 0.60,
  contact: 0.80
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
  
  // Cabins interaction state
  const [selectedCabinIndex, setSelectedCabinIndex] = useState(0);
  const currentCabin = cabins[selectedCabinIndex];

  // Global dates & booking state
  const [checkInDay, setCheckInDay] = useState(11);
  const [checkOutDay, setCheckOutDay] = useState(25);
  const [guests, setGuests] = useState(3);
  const [isLiked, setIsLiked] = useState(false);

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

  // Booking confirmation modal state
  const [selectedCabinForModal, setSelectedCabinForModal] = useState<Cabin | null>(null);
  const [modalCheckIn, setModalCheckIn] = useState('11');
  const [modalCheckOut, setModalCheckOut] = useState('25');
  const [modalGuests, setModalGuests] = useState(3);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // Lightbox state
  const [lightboxState, setLightboxState] = useState<{ cabinIndex: number, photoIndex: number } | null>(null);

  // Disable background scrolling when any modal is open
  const isModalOpen = isBookingOpen || isLoginOpen || lightboxState !== null;
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

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 30) return;
      navigateTo(e.deltaY > 0 ? 1 : -1);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY; 
      
      if (Math.abs(deltaY) > 40) {
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
  }, [selectedCabinIndex, screen]);

  // Dynamic cycle through locations/cabins
  const cycleCabin = () => {
    setSelectedCabinIndex((prev) => (prev + 1) % cabins.length);
  };

  const handleOpenBooking = (cabin: Cabin, inDay: string, outDay: string, guestCount: number) => {
    setSelectedCabinForModal(cabin);
    setModalCheckIn(inDay);
    setModalCheckOut(outDay);
    setModalGuests(guestCount);
    setIsBookingOpen(true);
  };

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

      alert(`Message dispatched to WoodNest hosts. Reference: ${payload.ticketId}. Secure fallback copy queued to YunusemreKoyun26@gmail.com.`);
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
        <nav className="flex justify-between items-center w-full px-4 sm:px-8 py-2 z-40 bg-white/5 backdrop-blur-sm border-b border-white/10 shadow-sm">
          
          {/* Logo container (Parent div, contains span with 'WoodNest' text exactly, clicking returns to Locations) */}
          <div 
            onClick={() => setScreen('locations')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Leaf className="text-brand-accent group-hover:rotate-12 transition-transform select-none" size={24} />
            <span className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent select-none">
              WoodNest
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

              {/* Action buttons (Login placeholder / CTA) */}
              <button
                onClick={() => setIsLoginOpen(true)}
                className="bg-white/10 hover:bg-white text-white hover:text-black px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-md border border-white/20"
              >
                {t('nav.login')}
              </button>
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
                  {/* Left Column Section */}
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

                    <div className="max-w-md bg-black/15 backdrop-blur-md p-5 rounded-xl border border-white/5 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-amber-400/25 border border-amber-400/40 rounded px-2 py-0.5 text-amber-300 font-mono text-xs font-semibold">
                            ★ {currentCabin.rating}
                          </div>
                          <span className="text-xs text-white/60 font-medium">{language === 'tr' ? `${currentCabin.reviewsCount.toLocaleString()} ${t('loc.guestStays')}` : `from ${currentCabin.reviewsCount.toLocaleString()} ${t('loc.guestStays')}`}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsLiked(!isLiked)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer"
                          >
                            <Heart size={14} className={isLiked ? "fill-red-500 text-red-500" : "text-white"} />
                          </button>
                          <button 
                            onClick={cycleCabin}
                            className="p-2 bg-brand-accent/20 hover:bg-brand-accent text-brand-accent hover:text-black rounded-full transition-all cursor-pointer animate-pulse"
                            title="Cycle Cabin locations"
                          >
                            <Navigation size={14} className="transform rotate-45" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Reservation Control Card */}
                  <div className="w-full lg:w-[400px] flex items-center justify-center h-full">
                    <div className="glass-panel rounded-2xl p-4 sm:p-5 w-full flex flex-col gap-3 sm:gap-4 border border-white/15 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold">{t('loc.currentSanctuary')}</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            {t(`cabin.${currentCabin.id}.name`)}
                          </h2>
                          <p className="text-xs text-white/50">{t('loc.remoteLocation')}</p>
                        </div>
                        <button
                          onClick={cycleCabin}
                          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 hover:scale-105 transition-all shrink-0 cursor-pointer"
                          title="Switch to next sanctuary"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>

                      {/* Date Picker Grid */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div 
                          onClick={() => setCheckInDay(prev => Math.max(1, prev - 1))}
                          className="border border-white/15 rounded-xl p-3 bg-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all select-none"
                        >
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">{t('loc.checkIn')}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-brand-accent" />
                              <span className="font-semibold text-sm">{t('loc.may')} {checkInDay}</span>
                            </div>
                            <div className="flex flex-col text-[10px] text-white/40">
                              <button onClick={(e) => { e.stopPropagation(); setCheckInDay(prev => Math.max(1, prev - 1)); }} className="hover:text-white">▲</button>
                              <button onClick={(e) => { e.stopPropagation(); setCheckInDay(prev => Math.min(checkOutDay - 1, prev + 1)); }} className="hover:text-white">▼</button>
                            </div>
                          </div>
                        </div>

                        <div 
                          onClick={() => setCheckOutDay(prev => Math.min(31, prev + 1))}
                          className="border border-white/15 rounded-xl p-3 bg-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all select-none"
                        >
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">{t('loc.checkOut')}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-brand-accent" />
                              <span className="font-semibold text-sm">{t('loc.may')} {checkOutDay}</span>
                            </div>
                            <div className="flex flex-col text-[10px] text-white/40">
                              <button onClick={(e) => { e.stopPropagation(); setCheckOutDay(prev => Math.max(checkInDay + 1, prev - 1)); }} className="hover:text-white">▲</button>
                              <button onClick={(e) => { e.stopPropagation(); setCheckOutDay(prev => Math.min(31, prev + 1)); }} className="hover:text-white">▼</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guests control */}
                      <div className="border border-white/15 rounded-xl p-3 bg-white/5 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold block">{t('loc.totalGuests')}</span>
                          <span className="font-semibold text-sm">{guests} {t('loc.guestsAttending')}</span>
                        </div>
                        <div className="flex gap-2 bg-white/10 rounded-lg p-1">
                          <button
                            onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-4 text-center text-xs font-bold self-center">{guests}</span>
                          <button
                            onClick={() => setGuests(prev => Math.min(5, prev + 1))}
                            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Timings summary */}
                      <div className="flex justify-between text-xs border-b border-white/10 pb-4 text-white/70">
                        <div>
                          <span className="text-[9px] text-white/40 block leading-none mb-1">{t('loc.checkInWindow')}</span>
                          <span className="font-medium">{t('loc.after2pm')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-white/40 block leading-none mb-1">{t('loc.checkOutWindow')}</span>
                          <span className="font-medium">{t('loc.before12pm')}</span>
                        </div>
                      </div>

                      <div className="flex gap-4 items-center justify-between">
                        <div>
                          <div className="flex items-baseline leading-none">
                            <span className="text-3xl font-bold tracking-tight">${currentCabin.price}</span>
                            <span className="text-xs text-white/50 ml-1">{t('loc.perNight')}</span>
                          </div>
                          <span className="text-[10px] text-brand-accent tracking-wide font-medium">{t('loc.ecoService')}</span>
                        </div>
                        
                        <button
                          onClick={() => handleOpenBooking(currentCabin, `${checkInDay}`, `${checkOutDay}`, guests)}
                          className="bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shimmer-btn shadow-lg cursor-pointer"
                        >
                          {t('loc.reserveCabin')}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* ==================== SCREEN 2: ROOMS ==================== */}
              {screen === 'rooms' && (
                <>
                  {/* Left Column Section: Matching Layout structure precisely */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-4 lg:space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
                        <Compass className="animate-spin-slow" size={12} />
                        <span>{t('rooms.badge')}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[3.5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        {t('rooms.title1')}
                        <br />
                        {t('rooms.title2')}
                        <br />
                        <span className="text-brand-accent">{t('rooms.title3')}</span>
                      </h1>
                    </div>

                    {/* Room Specs & Details block */}
                    <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-white/60">{t('rooms.selected')}: <span className="font-semibold text-white">{currentCabin.name}</span></div>
                        <div className="flex gap-1.5 items-center">
                          <button 
                            onClick={cycleCabin}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs transition-colors"
                          >
                            {t('rooms.nextLodge')}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5 text-center bg-white/5 p-3 rounded-xl border border-white/5 text-[10px]">
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">{t('rooms.guests')}</span>
                          <span className="font-semibold text-white/95 text-xs">{t(`cabin.${currentCabin.id}.guests`)}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">{t('rooms.sleeping')}</span>
                          <span className="font-semibold text-white/95 text-xs">{t(`cabin.${currentCabin.id}.beds`)}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">{t('rooms.baths')}</span>
                          <span className="font-semibold text-white/95 text-xs">{t(`cabin.${currentCabin.id}.baths`)}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">{t('rooms.size')}</span>
                          <span className="font-semibold text-white/95 text-xs">{currentCabin.specs.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Guest Experience & Booking */}
                  <div className="w-full lg:w-[410px] space-y-4">
                    {/* Guest review diary block */}
                    <div className="bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-3 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold flex items-center gap-1.5">
                          <MessageSquare size={12} /> {t('rooms.guestRegister')}
                        </span>
                        <span className="text-[9px] text-white/50">{reviews.length} {t('rooms.totalEntries')}</span>
                      </div>
                      
                      <form onSubmit={handleReviewInscribe} className="grid grid-cols-1 gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            required 
                            placeholder={t('rooms.placeholderName')} 
                            value={newReviewAuthor} 
                            onChange={e => setNewReviewAuthor(e.target.value)}
                            className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] rounded focus:outline-none focus:border-brand-accent text-white flex-1"
                          />
                          <select 
                            value={newReviewRating} 
                            onChange={e => setNewReviewRating(Number(e.target.value))}
                            className="bg-white/5 border border-white/10 px-1 py-1 text-[10px] rounded focus:outline-none text-white/80 cursor-pointer"
                          >
                            <option value="5">★★★★★</option>
                            <option value="4">★★★★☆</option>
                            <option value="3">★★★☆☆</option>
                          </select>
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            required 
                            placeholder={t('rooms.placeholderComment')} 
                            value={newReviewComment}
                            onChange={e => setNewReviewComment(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-2 py-1.5 pr-8 text-[10px] rounded focus:outline-none focus:border-brand-accent text-white"
                          />
                          <button type="submit" className="absolute right-1 top-1 p-1 text-brand-accent hover:text-white transition-colors">
                            <Send size={12} />
                          </button>
                        </div>
                        {reviewSubmitted && (
                          <span className="text-[9px] text-emerald-400 font-mono animate-pulse">{t('rooms.inscribed')}</span>
                        )}
                      </form>

                      {/* Recent Reviews dynamic list */}
                      <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar pt-1">
                        {reviews.slice(0, 3).map((rev) => (
                          <div key={rev.id} className="text-[11px] bg-white/5 p-2 rounded border border-white/5">
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="font-semibold text-white/90">{rev.userName}</span>
                              <span className="text-amber-400">{'★'.repeat(rev.rating)}</span>
                            </div>
                            <p className="text-white/70 italic text-light leading-snug">"{rev.comment}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(currentCabin, `${checkInDay}`, `${checkOutDay}`, guests)}
                      className="w-full bg-white text-brand-emerald text-xs font-semibold py-3.5 rounded-xl hover:bg-brand-accent hover:scale-[1.01] active:scale-95 transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CalendarCheck size={14} />
                      <span>{t('rooms.bookButton')}{currentCabin.price}</span>
                    </button>
                  </div>
                </>
              )}

              {/* ==================== SCREEN 3: ATMOSPHERE ==================== */}
              {screen === 'atmosphere' && (
                <>
                  {/* Left Column Section */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-4 lg:space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
                        <Flame className="animate-pulse" size={12} />
                        <span>{t('atm.badge')}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[3.5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        {t('atm.title1')}
                        <br />
                        {t('atm.title2')}
                        <br />
                        <span className="text-brand-accent">{t('atm.title3')}</span>
                      </h1>
                    </div>

                    <div className="max-w-md bg-black/15 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-white/5 space-y-4 shadow-lg">
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                        {t('atm.desc')}
                      </p>
                    </div>
                  </div>

                  {/* Right Column Section: Room Image Gallery instead of Climate/Sound */}
                  <div className="w-full lg:w-[410px] grid grid-cols-2 gap-3">
                    {cabins.map((cabin, index) => (
                      <div 
                        key={cabin.id}
                        onClick={() => {
                          setSelectedCabinIndex(index);
                          setLightboxState({ cabinIndex: index, photoIndex: 0 });
                        }}
                        className={`relative rounded-xl overflow-hidden cursor-zoom-in transition-all duration-300 group h-32 sm:h-40 ${
                          currentCabin.id === cabin.id 
                            ? 'border-2 border-brand-accent shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                            : 'border border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                        }`}
                      >
                        <img 
                          src={cabin.imageUrl} 
                          alt={t(`cabin.${cabin.id}.name`)}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-white text-[10px] sm:text-xs font-semibold leading-tight drop-shadow-md block">
                            {t(`cabin.${cabin.id}.name`)}
                          </span>
                        </div>
                        {currentCabin.id === cabin.id && (
                          <div className="absolute top-2 right-2 bg-brand-accent text-brand-emerald text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                            {t('rooms.selected')}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Eye size={14} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}


              {/* ==================== SCREEN 3: EXPERIENCES ==================== */}
              {screen === 'experiences' && (
                <>
                  {/* Left Column Section: Matching Layout structure precisely */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center h-full space-y-4 lg:space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
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
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
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
                    <div className="glass-panel rounded-2xl p-4 w-full flex flex-col gap-3 border border-white/15 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold font-mono">{t('exp.planner')}</span>
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
                          className="border border-white/15 rounded-xl p-3 bg-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all select-none"
                        >
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">{t('exp.targetDate')}</span>
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
                          className="border border-white/15 rounded-xl p-2.5 bg-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all select-none"
                        >
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">{t('exp.activitySize')}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">{expGuests} {t('exp.attendees')}</span>
                            </div>
                            <span className="text-[10px] text-white/40">▲</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs text-white/70">
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
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
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
                    <form onSubmit={handleContactDispatch} className="glass-panel rounded-2xl p-4 w-full flex flex-col gap-3 border border-white/15 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold font-mono">{t('contact.secureInquire')}</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            {t('contact.panel')}
                          </h2>
                          <p className="text-xs text-white/50">{t('contact.satellite')}</p>
                        </div>
                      </div>

                      {/* Inputs styled perfectly matching theme input inputs */}
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">{t('contact.yourName')}</span>
                          <input 
                            type="text" 
                            required 
                            placeholder={t('contact.placeholderName2')} 
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-xs px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-accent"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">{t('contact.topic')}</span>
                          <select 
                            value={contactCategory}
                            onChange={(e) => setContactCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-xs px-2.5 py-2.5 rounded-xl text-white/80 focus:outline-none cursor-pointer"
                          >
                            <option value="Check-in Guidelines">{t('contact.topicOpt1')}</option>
                            <option value="Cabin upgrades">{t('contact.topicOpt2')}</option>
                            <option value="Solar protocol & Heating">{t('contact.topicOpt3')}</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">{t('contact.message')}</span>
                          <textarea 
                            required 
                            rows={3}
                            placeholder={t('contact.placeholderMsg')} 
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-xs p-3 rounded-xl text-white focus:outline-none focus:border-brand-accent resize-none placeholder:text-white/30"
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
                        className="w-full bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shimmer-btn shadow-lg cursor-pointer flex justify-center items-center gap-2"
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
        <div className="flex justify-between items-center p-4 sm:px-8 sm:py-3 bg-white/5 border-t border-white/10 text-xs text-white/40 font-mono z-20">
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

      {/* Booking summary modal window integration */}
      {selectedCabinForModal && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          cabin={selectedCabinForModal}
          checkInDate={modalCheckIn}
          checkOutDate={modalCheckOut}
          guestsCount={modalGuests}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(user, redirectTo) => {
          setIsLoginOpen(false);
          router.push(redirectTo);
          router.refresh();
        }}
      />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxState !== null && (() => {
          const lbCabin = cabins[lightboxState.cabinIndex];
          const lbImages = lbCabin.images || [lbCabin.imageUrl];
          const lbIndex = lightboxState.photoIndex;
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxState(null)}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            >
              <div className="relative w-full max-w-7xl h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <motion.img
                  key={lbIndex}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={lbImages[lbIndex]}
                  alt="Büyük Görünüm"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                
                {lbImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setLightboxState(prev => prev ? { ...prev, photoIndex: prev.photoIndex === 0 ? lbImages.length - 1 : prev.photoIndex - 1 } : null); 
                      }}
                      className="absolute left-0 sm:left-4 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3 cursor-pointer"
                    >
                      <ChevronLeft size={28} />
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setLightboxState(prev => prev ? { ...prev, photoIndex: prev.photoIndex === lbImages.length - 1 ? 0 : prev.photoIndex + 1 } : null); 
                      }}
                      className="absolute right-0 sm:right-4 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-3 cursor-pointer"
                    >
                      <ChevronRight size={28} />
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => setLightboxState(null)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-2 cursor-pointer z-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
