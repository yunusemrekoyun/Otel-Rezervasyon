'use client';

import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { RoomCard } from '../RoomCard';
import { roomImage, type RoomData } from '../types';

// Rooms list — design-refs/refs.pdf pages 1-2:
// "< Back" + "Odalarımız" + vertical full-width RoomCard list.
export function MobileRooms({
  rooms,
  loading,
  onBack,
  onSelectRoom,
}: {
  rooms: RoomData[];
  loading: boolean;
  onBack: () => void;
  onSelectRoom: (id: string) => void;
}) {
  const { language } = useLanguage();
  const tr = language === 'tr';

  return (
    <div className="space-y-5 px-4 py-5">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 flex items-center gap-0.5 font-hotel text-base text-hotel-text-primary"
      >
        <ChevronLeft size={20} />
        {tr ? 'Geri' : 'Back'}
      </button>

      <h1 className="font-serif text-3xl font-bold text-hotel-text-primary">
        {tr ? 'Odalarımız' : 'Our Rooms'}
      </h1>

      <div className="space-y-4">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            className="w-full"
            image={roomImage(room) ?? '/logo.png'}
            name={room.name}
            subtitle={room.roomType?.name}
            priceText={`₺${room.basePrice.toLocaleString('tr-TR')}`}
            perNight={tr ? '/ gece' : '/ night'}
            meta={`${room.maxAdults} ${tr ? 'Kişilik' : 'Guests'}`}
            ctaLabel={tr ? 'İncele' : 'View'}
            onSelect={() => onSelectRoom(room.id)}
          />
        ))}

        {loading && (
          <p className="py-6 text-center text-sm text-hotel-text-muted">
            {tr ? 'Odalar yükleniyor…' : 'Loading rooms…'}
          </p>
        )}
        {!loading && rooms.length === 0 && (
          <p className="py-6 text-center text-sm text-hotel-text-muted">
            {tr ? 'Henüz oda eklenmemiş.' : 'No rooms yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
