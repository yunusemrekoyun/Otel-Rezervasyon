'use client';

// TEMPORARY component gallery for the mobile redesign (FAZ 2 review).
// Open at /mobile-preview. Safe to delete once the real screens are built.

import { useState } from 'react';
import { Wifi, Croissant, Clock, ConciergeBell } from 'lucide-react';
import {
  MobileHeader,
  MobileBottomTab,
  AmenityChip,
  RoomCard,
  StepperDots,
  type MobileTab,
} from '@/components/mobile';

export default function MobilePreviewPage() {
  const [tab, setTab] = useState<MobileTab>('home');
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-dvh bg-neutral-900 py-6">
      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[2rem] border border-hotel-border bg-hotel-bg font-hotel text-hotel-text-primary shadow-2xl">
        <MobileHeader />

        <div className="space-y-8 px-4 py-6 pb-24">
          <Section title="AmenityChip">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              <AmenityChip icon={Wifi} label="Ücretsiz Wi-Fi" />
              <AmenityChip icon={Croissant} label="Kahvaltı Dahil" />
              <AmenityChip icon={Clock} label="7/24 Resepsiyon" />
              <AmenityChip icon={ConciergeBell} label="Vale Hizmeti" />
            </div>
          </Section>

          <Section title="RoomCard (liste)">
            <RoomCard
              image="https://picsum.photos/seed/deluxe/640/360"
              name="Deluxe Oda"
              subtitle="Şehir manzaralı"
              priceText="₺2.400"
              perNight="/ gece"
              meta="2 Kişilik · 25m²"
              ctaLabel="İncele"
            />
          </Section>

          <Section title="RoomCard (carousel)">
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
              <RoomCard
                className="w-72 shrink-0"
                image="https://picsum.photos/seed/standart/640/360"
                name="Standart Oda"
                subtitle="Şehir manzaralı"
                priceText="₺1.800"
                perNight="/ gece"
                meta="2 Kişilik · 25m²"
                ctaLabel="İncele"
              />
              <RoomCard
                className="w-72 shrink-0"
                image="https://picsum.photos/seed/superior/640/360"
                name="Superior Süit"
                subtitle="Şehir manzaralı"
                priceText="₺3.500"
                perNight="/ gece"
                meta="2 Kişilik · 25m²"
                ctaLabel="İncele"
              />
            </div>
          </Section>

          <Section title="StepperDots">
            <div className="space-y-4">
              <StepperDots current={step} />
              <div className="flex gap-2">
                {[0, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className="btn-hotel-outline h-9 flex-1 text-sm"
                  >
                    Adım {s + 1}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Butonlar">
            <div className="space-y-3">
              <button className="btn-hotel">Rezervasyon Yap →</button>
              <button className="btn-hotel-secondary w-full">İkincil (beige)</button>
              <button className="btn-hotel-outline w-full">Outline</button>
            </div>
          </Section>

          <Section title="input-hotel">
            <input className="input-hotel" placeholder="Adınız" />
          </Section>
        </div>

        <MobileBottomTab active={tab} onTabChange={setTab} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="font-hotel text-[11px] uppercase tracking-widest text-hotel-text-muted">
        {title}
      </p>
      {children}
    </section>
  );
}
