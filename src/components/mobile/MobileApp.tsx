'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { MobileHeader } from './MobileHeader';
import { MobileBottomTab, type MobileTab } from './MobileBottomTab';
import { MobileHome } from './screens/MobileHome';
import { MobileRooms } from './screens/MobileRooms';
import { MobileRoomDetail } from './screens/MobileRoomDetail';
import { MobileBooking } from './screens/MobileBooking';
import { MobileServices } from './screens/MobileServices';
import { MobileReviews } from './screens/MobileReviews';
import { MobileContact } from './screens/MobileContact';
import type { RoomData } from './types';

// In-page mobile shell (md:hidden). Client-side screen state + persistent header
// and bottom tab; desktop keeps the existing App.tsx (rendered hidden md:block in
// app/page.tsx). Built screen by screen — Home + Rooms done, rest stubbed.
type Screen = 'home' | 'rooms' | 'room-detail' | 'booking' | 'services' | 'reviews' | 'contact' | 'profile';

export function MobileApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  // Where room-detail was opened from, so "back" returns there.
  const [roomOrigin, setRoomOrigin] = useState<Screen>('rooms');

  // Public rooms are shared across Home / Rooms / Room-detail / Booking — fetch once.
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/rooms')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setRooms(d.rooms as RoomData[]);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const tabFor = (s: Screen): MobileTab =>
    s === 'rooms' || s === 'room-detail' || s === 'booking'
      ? 'rooms'
      : s === 'services' || s === 'reviews' || s === 'contact'
        ? 'services'
        : s === 'profile'
          ? 'profile'
          : 'home';

  const onTab = (t: MobileTab) =>
    setScreen(t === 'home' ? 'home' : t === 'rooms' ? 'rooms' : t === 'services' ? 'services' : 'profile');

  const selectRoom = (id: string) => {
    setRoomOrigin(screen === 'rooms' ? 'rooms' : 'home');
    setSelectedRoomId(id);
    setScreen('room-detail');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-hotel-bg font-hotel text-hotel-text-primary">
      <MobileHeader onLogoClick={() => setScreen('home')} />

      <main className="flex-1 pb-20">
        {screen === 'home' && (
          <MobileHome
            rooms={rooms}
            loading={loading}
            onBook={() => setScreen('booking')}
            onSelectRoom={selectRoom}
          />
        )}
        {screen === 'rooms' && (
          <MobileRooms
            rooms={rooms}
            loading={loading}
            onBack={() => setScreen('home')}
            onSelectRoom={selectRoom}
          />
        )}
        {screen === 'room-detail' && (
          <MobileRoomDetail
            room={rooms.find((r) => r.id === selectedRoomId) ?? null}
            onBack={() => setScreen(roomOrigin)}
            onBook={() => setScreen('booking')}
          />
        )}
        {screen === 'booking' && (
          <MobileBooking
            rooms={rooms}
            initialRoomTypeId={rooms.find((r) => r.id === selectedRoomId)?.roomTypeId ?? null}
            onExit={() => setScreen('home')}
          />
        )}
        {screen === 'services' && (
          <MobileServices
            onReviews={() => setScreen('reviews')}
            onContact={() => setScreen('contact')}
          />
        )}
        {screen === 'reviews' && <MobileReviews onBack={() => setScreen('services')} />}
        {screen === 'contact' && <MobileContact onBack={() => setScreen('services')} />}
        {screen === 'profile' && <Stub screen={screen} />}
      </main>

      <MobileBottomTab active={tabFor(screen)} onTabChange={onTab} />
    </div>
  );
}

function Stub({ screen, note }: { screen: string; note?: string | null }) {
  const { language } = useLanguage();
  const tr = language === 'tr';
  const labels: Record<string, { tr: string; en: string }> = {
    'room-detail': { tr: 'Oda Detayı', en: 'Room Detail' },
    booking: { tr: 'Rezervasyon', en: 'Booking' },
    contact: { tr: 'İletişim & Konum', en: 'Contact & Location' },
    profile: { tr: 'Profil', en: 'Profile' },
  };
  const label = labels[screen] ?? { tr: screen, en: screen };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-serif text-2xl text-hotel-text-primary">{tr ? label.tr : label.en}</p>
      <p className="font-hotel text-sm text-hotel-text-muted">
        {tr ? 'Bu ekran sıradaki adımda yapılacak.' : 'This screen is coming in the next step.'}
      </p>
      {note && <p className="font-hotel text-xs text-hotel-text-muted/70">#{note}</p>}
    </div>
  );
}
