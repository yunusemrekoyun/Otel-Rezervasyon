'use client';

import { useState } from 'react';
import { DoorOpen, BedDouble } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { RoomManager } from '@/components/admin/RoomManager';
import { RoomTypeManager } from '@/components/admin/RoomTypeManager';

type SubTab = 'rooms' | 'types';

export function OdalarSection() {
  const { language } = useLanguage();
  const tr = language === 'tr';
  const [activeTab, setActiveTab] = useState<SubTab>('rooms');

  const tabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: 'rooms', label: tr ? 'Odalar' : 'Rooms', icon: DoorOpen },
    { id: 'types', label: tr ? 'Oda Çeşitleri' : 'Room Types', icon: BedDouble },
  ];

  return (
    <div className="space-y-5">

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] w-fit">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20'
                  : 'text-white/40 hover:text-white/70 border border-transparent hover:bg-white/5'}
              `}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'rooms' ? <RoomManager /> : <RoomTypeManager />}

    </div>
  );
}
