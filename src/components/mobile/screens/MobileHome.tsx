'use client';

import { MapPin, Wifi, Croissant, Clock, ConciergeBell, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AmenityChip } from '../AmenityChip';
import { RoomCard } from '../RoomCard';
import { roomImage, type RoomData } from '../types';

// Home screen — design-refs/refs.pdf pages 15-16:
// hero card (image + serif title + location chip + tagline + peach CTA),
// horizontal amenity chips, "Öne Çıkan Odalar" room carousel.
export function MobileHome({
  rooms,
  loading,
  onBook,
  onSelectRoom,
}: {
  rooms: RoomData[];
  loading: boolean;
  onBook: () => void;
  onSelectRoom: (id: string) => void;
}) {
  const { language } = useLanguage();
  const tr = language === 'tr';

  const heroImg = rooms.map(roomImage).find(Boolean) ?? null;
  const featured = rooms.slice(0, 6);

  const amenities = [
    { icon: Wifi, label: tr ? 'Ücretsiz Wi-Fi' : 'Free Wi-Fi' },
    { icon: Croissant, label: tr ? 'Kahvaltı Dahil' : 'Breakfast Incl.' },
    { icon: Clock, label: tr ? '7/24 Resepsiyon' : '24/7 Reception' },
    { icon: ConciergeBell, label: tr ? 'Vale Hizmeti' : 'Valet Service' },
    { icon: ShieldCheck, label: tr ? 'Güvenli Otopark' : 'Secure Parking' },
  ];

  return (
    <div className="space-y-7 px-4 py-5">
      {/* ── Hero ── */}
      <section className="relative h-[58vh] min-h-[420px] overflow-hidden rounded-2xl border border-hotel-border">
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-hotel-surface-2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-hotel-bg via-hotel-bg/45 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-5 text-center">
          <h1 className="font-serif text-4xl font-bold leading-tight text-hotel-text-primary drop-shadow-lg">
            Kütahya Garden Otel
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-sm text-hotel-text-primary backdrop-blur-sm">
            <MapPin size={14} className="text-hotel-peach" />
            {tr ? 'Kütahya Merkez' : 'Kütahya Center'}
          </span>
          <p className="text-sm text-hotel-text-primary/85">
            {tr
              ? 'Şehrin kalbinde lüks ve tarihi bir dokunuş.'
              : 'A luxurious, historic touch in the heart of the city.'}
          </p>
          <button type="button" onClick={onBook} className="btn-hotel mt-2">
            {tr ? 'Rezervasyon Yap' : 'Book Now'} →
          </button>
        </div>
      </section>

      {/* ── Amenities ── */}
      <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
        {amenities.map((a) => (
          <AmenityChip key={a.label} icon={a.icon} label={a.label} />
        ))}
      </section>

      {/* ── Featured rooms ── */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-hotel-text-primary">
          {tr ? 'Öne Çıkan Odalar' : 'Featured Rooms'}
        </h2>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          {featured.map((room) => (
            <RoomCard
              key={room.id}
              className="w-72 shrink-0"
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
            <p className="py-6 text-sm text-hotel-text-muted">
              {tr ? 'Odalar yükleniyor…' : 'Loading rooms…'}
            </p>
          )}
          {!loading && featured.length === 0 && (
            <p className="py-6 text-sm text-hotel-text-muted">
              {tr ? 'Henüz oda eklenmemiş.' : 'No rooms yet.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
