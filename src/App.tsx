'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Pencil, Calendar, Sparkles, Navigation, Heart, ShieldCheck, 
  Compass, MessageSquare, Send, CheckCircle2, ChevronLeft, ChevronRight, 
  MapPin, Mail, Phone, Lock, Eye, CalendarCheck, HelpCircle, Flame, Droplets, Fan,
  Leaf, Menu
} from 'lucide-react';
import { cabins, experiencesData, reviews as initialReviews } from './data';
import { Cabin, Review } from './types';
import { SoundMixer } from './components/SoundMixer';
import { ClimateControl } from './components/ClimateControl';
import { BookingModal } from './components/BookingModal';
import { LoginModal } from './components/auth/LoginModal';

export default function App() {
  const router = useRouter();

  // Screen names supporting navigation specs
  const [screen, setScreen] = useState<'locations' | 'rooms' | 'experiences' | 'contact'>('locations');
  
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
    <div className="relative w-full min-h-screen text-white flex items-center justify-center p-3 sm:p-6 md:p-10 select-none overflow-hidden font-sans bg-[#070f12]">
      
      {/* Dynamic Animated Background Filter mapping with AnimatePresence */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <AnimatePresence mode="wait">
          <motion.img
            key={currentCabin.id}
            src={currentCabin.imageUrl}
            alt={currentCabin.name}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            className="w-full h-full object-cover filter brightness-[0.7] saturate-[1.1] select-none pointer-events-none"
          />
        </AnimatePresence>
      </div>

      {/* Main Glass Frame Shell */}
      <div className="w-full max-w-[1440px] min-h-[825px] glass-frame relative flex flex-col justify-between z-20 overflow-hidden border border-white/20 shadow-2xl">
        
        {/* Navigation Header strictly matching Navigation Flow specs */}
        <nav className="flex justify-between items-center w-full px-4 sm:px-8 py-5 z-40 bg-white/5 backdrop-blur-sm border-b border-white/10">
          
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

          {/* Navigation links with exact XPaths mapped across screens */}
          <ul className="hidden md:flex items-center gap-1.5 bg-black/25 p-1 rounded-full border border-white/5">
            <li>
              <a
                onClick={() => setScreen('locations')}
                className={`font-medium text-xs tracking-wider uppercase px-4 py-2 rounded-full cursor-pointer block transition-all ${
                  screen === 'locations' ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Locations
              </a>
            </li>
            <li className="list-none">
              <a
                onClick={() => setScreen('rooms')}
                className={`font-medium text-xs tracking-wider uppercase px-4 py-2 rounded-full cursor-pointer block transition-all ${
                  screen === 'rooms' ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Rooms
              </a>
            </li>
            <li>
              <a
                onClick={() => setScreen('experiences')}
                className={`font-medium text-xs tracking-wider uppercase px-4 py-2 rounded-full cursor-pointer block transition-all ${
                  screen === 'experiences' ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Experiences
              </a>
            </li>
            <li>
              <a
                onClick={() => setScreen('contact')}
                className={`font-medium text-xs tracking-wider uppercase px-4 py-2 rounded-full cursor-pointer block transition-all ${
                  screen === 'contact' ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Action triggers */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-white text-brand-emerald hover:bg-brand-accent hover:scale-[1.03] active:scale-95 text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 cursor-pointer hidden sm:block"
            >
              Login Now
            </button>
            <button 
              onClick={() => {
                // Mobile state switcher carousel
                const order: Array<'locations' | 'rooms' | 'experiences' | 'contact'> = ['locations', 'rooms', 'experiences', 'contact'];
                const nextInd = (order.indexOf(screen) + 1) % order.length;
                setScreen(order[nextInd]);
              }}
              className="md:hidden text-white/80 p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>

        {/* Unified Subscreen Left/Right Columns Body */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.main
              key={screen}
              initial={{ opacity: 0, scale: 0.99, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -5 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col lg:flex-row items-center justify-between p-6 sm:p-10 lg:p-16 gap-8 w-full"
            >

              {/* ==================== SCREEN 1: LOCATIONS ==================== */}
              {screen === 'locations' && (
                <>
                  {/* Left Column Section */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-between h-full space-y-8 sm:space-y-12">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>Luxury Wilderness Cabins</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        Nature's
                        <br />
                        Perfect
                        <br />
                        <span className="text-brand-accent">Hideaways</span>
                      </h1>
                    </div>

                    <div className="max-w-md bg-black/15 backdrop-blur-md p-5 rounded-xl border border-white/5 space-y-4 shadow-lg">
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                        Discover curated architectural lodges floating on silent fjords, hanging in pine canopies, or looking directly into the Arctic aurora. Custom tailored for digital disconnect.
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-amber-400/25 border border-amber-400/40 rounded px-2 py-0.5 text-amber-300 font-mono text-xs font-semibold">
                            ★ {currentCabin.rating}
                          </div>
                          <span className="text-xs text-white/60 font-medium">from {currentCabin.reviewsCount.toLocaleString()} guest stays</span>
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
                  <div className="w-full lg:w-[410px] items-center">
                    <div className="glass-panel rounded-2xl p-6 w-full flex flex-col gap-5 border border-white/15 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold">Current Sanctuary</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            {currentCabin.name}
                          </h2>
                          <p className="text-xs text-white/50">{currentCabin.location}</p>
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
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">Check-in</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-brand-accent" />
                              <span className="font-semibold text-sm">May {checkInDay}</span>
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
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">Check-out</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-brand-accent" />
                              <span className="font-semibold text-sm">May {checkOutDay}</span>
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
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold block">Total Guests</span>
                          <span className="font-semibold text-sm">{guests} guests attending</span>
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
                          <span className="text-[9px] text-white/40 block leading-none mb-1">Check-in window</span>
                          <span className="font-medium">After 2:00 PM</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-white/40 block leading-none mb-1">Check-out window</span>
                          <span className="font-medium">Before 12:00 PM</span>
                        </div>
                      </div>

                      <div className="flex gap-4 items-center justify-between">
                        <div>
                          <div className="flex items-baseline leading-none">
                            <span className="text-3xl font-bold tracking-tight">${currentCabin.price}</span>
                            <span className="text-xs text-white/50 ml-1">/night</span>
                          </div>
                          <span className="text-[10px] text-brand-accent tracking-wide font-medium">Eco service included</span>
                        </div>
                        
                        <button
                          onClick={() => handleOpenBooking(currentCabin, `${checkInDay}`, `${checkOutDay}`, guests)}
                          className="bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shimmer-btn shadow-lg cursor-pointer"
                        >
                          Reserve Cabin
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
                  <div className="w-full lg:w-1/2 flex flex-col justify-between h-full space-y-6 sm:space-y-8">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
                        <Compass className="animate-spin-slow" size={12} />
                        <span>Living Quarters specifications</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        Architectural
                        <br />
                        Wilderness
                        <br />
                        <span className="text-brand-accent">Suites</span>
                      </h1>
                    </div>

                    {/* Room Specs & Details block */}
                    <div className="bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-white/60">Selected: <span className="font-semibold text-white">{currentCabin.name}</span></div>
                        <div className="flex gap-1.5 items-center">
                          <button 
                            onClick={cycleCabin}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs transition-colors"
                          >
                            Next Lodge ➔
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5 text-center bg-white/5 p-3 rounded-xl border border-white/5 text-[10px]">
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">Guests</span>
                          <span className="font-semibold text-white/95 text-xs">{currentCabin.specs.guests}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">Sleeping</span>
                          <span className="font-semibold text-white/95 text-xs">{currentCabin.specs.beds}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">Baths</span>
                          <span className="font-semibold text-white/95 text-xs">{currentCabin.specs.baths}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block mb-0.5 uppercase tracking-widest text-[8px]">Size</span>
                          <span className="font-semibold text-white/95 text-xs">{currentCabin.specs.size}</span>
                        </div>
                      </div>

                      {/* Guest review diary block */}
                      <div className="border-t border-white/10 pt-3 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold flex items-center gap-1.5">
                            <MessageSquare size={12} /> Guest Experience Register
                          </span>
                          <span className="text-[9px] text-white/50">{reviews.length} total entries</span>
                        </div>

                        {/* Direct memory entry form */}
                        <form onSubmit={handleReviewInscribe} className="grid grid-cols-1 gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required 
                              placeholder="Name" 
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
                              placeholder="Add thoughts about the forest retreat..." 
                              value={newReviewComment}
                              onChange={e => setNewReviewComment(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 px-2 py-1.5 pr-8 text-[10px] rounded focus:outline-none focus:border-brand-accent text-white"
                            />
                            <button type="submit" className="absolute right-1 top-1 p-1 text-brand-accent hover:text-white transition-colors">
                              <Send size={12} />
                            </button>
                          </div>
                          {reviewSubmitted && (
                            <span className="text-[9px] text-emerald-400 font-mono animate-pulse">Inscribed beautifully!</span>
                          )}
                        </form>

                        {/* Recent Reviews dynamic list */}
                        <div className="space-y-2 max-h-[105px] overflow-y-auto no-scrollbar pt-1">
                          {reviews.slice(0, 2).map((rev) => (
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
                    </div>
                  </div>

                  {/* Right Column Section: Climate & Sound Control Cards mapped with same sizes */}
                  <div className="w-full lg:w-[410px] space-y-3.5">
                    {/* Embedded Climate Control & Web Synth widgets conforming beautifully directly */}
                    <ClimateControl 
                      initialTemp={currentCabin.climate.temperature} 
                      initialHumidity={currentCabin.climate.humidity} 
                    />
                    <SoundMixer />

                    {/* Quick booking override block */}
                    <button
                      onClick={() => handleOpenBooking(currentCabin, `${checkInDay}`, `${checkOutDay}`, guests)}
                      className="w-full bg-white text-brand-emerald text-xs font-semibold py-3 rounded-xl hover:bg-brand-accent hover:scale-[1.01] active:scale-95 transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CalendarCheck size={14} />
                      <span>Book current sanctuary suite at ${currentCabin.price}/night</span>
                    </button>
                  </div>
                </>
              )}


              {/* ==================== SCREEN 3: EXPERIENCES ==================== */}
              {screen === 'experiences' && (
                <>
                  {/* Left Column Section: Matching Layout structure precisely */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-between h-full space-y-8 sm:space-y-12">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>Curated off-grid activities</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        Sensory
                        <br />
                        Outdoor
                        <br />
                        <span className="text-brand-accent">Excursions</span>
                      </h1>
                    </div>

                    {/* Interactive Experiences Selector and dynamic highlights */}
                    <div className="max-w-md bg-black/15 backdrop-blur-md p-5 rounded-xl border border-white/5 space-y-4 shadow-lg">
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
                            {e.name.split(' ')[0]} / {e.name.split(' ').slice(1).join(' ')}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm text-white">{currentExp.name}</h3>
                          <span className="text-xs text-brand-accent font-semibold">{currentExp.duration}</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed font-light">
                          {currentExp.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-amber-400/25 border border-amber-400/40 rounded px-2 py-0.5 text-amber-300 font-mono text-xs font-semibold">
                            ★ {currentExp.rating}
                          </div>
                          <span className="text-xs text-white/60 font-medium">99% Guest Recommendation rating</span>
                        </div>
                        <span className="text-xs text-white/40">Includes all gear</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Custom Experience Planning Card matching reservation structure */}
                  <div className="w-full lg:w-[410px] items-center">
                    <div className="glass-panel rounded-2xl p-6 w-full flex flex-col gap-5 border border-white/15 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold font-mono">Experience Planner</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            {currentExp.name}
                          </h2>
                          <p className="text-xs text-white/50">Guided in Norwegian Wilderness Lands</p>
                        </div>
                      </div>

                      {/* Custom selectors aligned nicely to original picker slots */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div 
                          onClick={() => setExpDay(prev => Math.max(1, prev - 1))}
                          className="border border-white/15 rounded-xl p-3 bg-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all select-none"
                        >
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">Target Date</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-brand-accent" />
                              <span className="font-semibold text-sm">May {expDay}</span>
                            </div>
                            <span className="text-[10px] text-white/40">▼</span>
                          </div>
                        </div>

                        <div 
                          onClick={() => setExpGuests(prev => Math.min(6, prev + 1))}
                          className="border border-white/15 rounded-xl p-2.5 bg-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-all select-none"
                        >
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-semibold mb-1">Activity Size</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">{expGuests} attendees</span>
                            </div>
                            <span className="text-[10px] text-white/40">▲</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs text-white/70">
                        <div className="flex justify-between">
                          <span>Base fee (per adventurer)</span>
                          <span>${currentExp.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance & Gear hire</span>
                          <span>$15</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
                          <span>Estimated Subtotal</span>
                          <span className="text-brand-accent">${(currentExp.price + 15) * expGuests}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-white/50">
                        <span>✓ Certified Wilderness Ranger</span>
                        <span>✓ Complimentary safety briefing</span>
                      </div>

                      <button
                        onClick={handleExperienceBooking}
                        disabled={experienceSubmitting}
                        className="w-full bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shimmer-btn shadow-lg cursor-pointer text-center"
                      >
                        {experienceSubmitting ? 'Securing Wilderness Booking...' : `Secure Wilderness Booking • $${(currentExp.price + 15) * expGuests}`}
                      </button>
                    </div>
                  </div>
                </>
              )}


              {/* ==================== SCREEN 4: CONTACT ==================== */}
              {screen === 'contact' && (
                <>
                  {/* Left Column Section: Matching Layout structure precisely */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-between h-full space-y-8 sm:space-y-12">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-4">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>Direct Cabin Liaison</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-medium tracking-tighter leading-none text-white font-sans">
                        Off-Grid
                        <br />
                        Host
                        <br />
                        <span className="text-brand-accent">Concierge</span>
                      </h1>
                    </div>

                    {/* GPS coordinates & off-grid self check-in assistance guidelines */}
                    <div className="max-w-md bg-black/15 backdrop-blur-md p-5 rounded-xl border border-white/5 space-y-4 shadow-lg">
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                        We operate on 100% solar and satellite grids. For direct support, checking-in keys coordinates, or custom off-grid accommodations, consult our real-time channel.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/10 pt-3 text-white/80">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-brand-accent tracking-widest uppercase font-mono mb-1 font-semibold">Active Coordinates</span>
                          <span>60.1132° N, 6.0124° E</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-brand-accent tracking-widest uppercase font-mono mb-1 font-semibold">Inbound Channel</span>
                          <span>YunusemreKoyun26@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Section: Dynamic Inbound Contact Form matching identical Reservation structure layout */}
                  <div className="w-full lg:w-[410px] items-center">
                    <form onSubmit={handleContactDispatch} className="glass-panel rounded-2xl p-6 w-full flex flex-col gap-4 border border-white/15 shadow-2xl relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-brand-accent uppercase tracking-widest font-semibold font-mono">Secure Direct Inquire</span>
                          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                            Transmission Panel
                          </h2>
                          <p className="text-xs text-white/50">Lodge system active satellite link</p>
                        </div>
                      </div>

                      {/* Inputs styled perfectly matching theme input inputs */}
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">Your Name</span>
                          <input 
                            type="text" 
                            required 
                            placeholder="Type your name..." 
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-xs px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-accent"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">Inquiry Topic</span>
                          <select 
                            value={contactCategory}
                            onChange={(e) => setContactCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-xs px-2.5 py-2.5 rounded-xl text-white/80 focus:outline-none cursor-pointer"
                          >
                            <option value="Check-in Guidelines">Check-in Guidelines / Directions</option>
                            <option value="Cabin upgrades">Lodge or Cabin Upgrade</option>
                            <option value="Solar protocol & Heating">Solar Protocol / heating details</option>
                            <option value="Other offgrid requests">Other requests</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">Message description</span>
                          <textarea 
                            required 
                            rows={3}
                            placeholder="Describe how we can assist your off-grid adventure..." 
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-xs p-3 rounded-xl text-white focus:outline-none focus:border-brand-accent resize-none placeholder:text-white/30"
                          />
                        </div>
                      </div>

                      {contactSuccess && (
                        <div className="text-[10px] text-emerald-300 flex items-center gap-1.5 py-0.5 animate-pulse">
                          <CheckCircle2 size={12} />
                          <span>Preparing secure packet transmission...</span>
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
                        className="w-full bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shimmer-btn shadow-lg cursor-pointer text-center"
                      >
                        {isContactSending ? 'Dispatching Concierge Packet...' : 'Dispatch Concierge Packet'}
                      </button>
                    </form>
                  </div>
                </>
              )}

            </motion.main>
          </AnimatePresence>
        </div>

        {/* Dynamic footer status bar indicator preserving locations screen visual 100% */}
        <div className="flex justify-between items-center p-6 sm:px-8 sm:py-6 bg-white/5 border-t border-white/10 text-xs text-white/40 font-mono z-20">
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Grid Status: 100% Off-Grid Solar Operational</span>
          </div>

          {/* Occupancy dynamic gauge with same layout size */}
          <div className="flex items-center gap-4">
              <span className="text-white font-sans text-5xl sm:text-[4.25rem] opacity-40 font-bold leading-none tracking-tight">
              {count}%
            </span>
            <div className="text-left leading-normal">
              <span className="text-[10px] text-brand-accent font-semibold block uppercase tracking-wider">Lodge Occupancy</span>
              <span className="text-[10px] text-white/55">Peak Wilderness Season</span>
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
          alert(`Hoş geldin ${user.roleName}`);
          router.push(redirectTo);
          router.refresh();
        }}
      />

    </div>
  );
}
