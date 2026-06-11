'use client';

import { Star, MapPin, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { ScreenHeader } from '../ScreenHeader';

// Services hub — the bottom-tab "Services" entry groups Reviews + Contact
// (agreed routing; the PDF ships these as separate screens).
export function MobileServices({
  onReviews,
  onContact,
}: {
  onReviews: () => void;
  onContact: () => void;
}) {
  const { language } = useLanguage();
  const tr = language === 'tr';

  const items = [
    {
      icon: Star,
      title: tr ? 'Misafir Değerlendirmeleri' : 'Guest Reviews',
      sub: tr ? 'Puanlar ve yorumlar' : 'Ratings & reviews',
      onClick: onReviews,
    },
    {
      icon: MapPin,
      title: tr ? 'İletişim & Konum' : 'Contact & Location',
      sub: tr ? 'Adres, telefon, mesaj' : 'Address, phone, message',
      onClick: onContact,
    },
  ];

  return (
    <div className="space-y-5 px-4 py-5">
      <ScreenHeader eyebrow={tr ? 'Otel' : 'Hotel'} title={tr ? 'Hizmetler' : 'Services'} />
      <div className="space-y-3">
        {items.map((it) => (
          <button
            key={it.title}
            type="button"
            onClick={it.onClick}
            className="card-hotel flex w-full items-center gap-4 p-5 text-left"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-hotel-peach/30 bg-hotel-peach/15">
              <it.icon size={22} className="text-hotel-peach" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg font-bold text-hotel-text-primary">{it.title}</p>
              <p className="font-hotel text-sm text-hotel-text-muted">{it.sub}</p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-hotel-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
