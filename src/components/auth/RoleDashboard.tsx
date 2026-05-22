'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';

interface RoleDashboardProps {
  user: AuthUser;
  authSource: 'access' | 'refresh';
}

export function RoleDashboard({ user, authSource }: RoleDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (authSource === 'refresh') {
      fetch('/api/auth/refresh', {
        method: 'POST',
      }).catch(() => undefined);
    }
  }, [authSource]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-[#070f12] text-white flex items-center justify-center p-6 font-sans">
      <section className="glass-frame w-full max-w-3xl p-8 sm:p-10 border border-white/15 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-3.5 py-1 text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-5">
              <ShieldCheck size={13} />
              <span>Protected Role Panel</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold leading-tight tracking-tight">
              Hoş geldin {user.roleName}
            </h1>
            <p className="mt-3 text-sm text-white/65">
              {user.email} hesabı ile güvenli oturum açıldı.
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white text-brand-emerald px-4 py-2 text-xs font-semibold hover:bg-brand-accent transition-all disabled:opacity-60"
          >
            <LogOut size={14} />
            <span>{isLoggingOut ? 'Çıkılıyor...' : 'Logout'}</span>
          </button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="glass-panel rounded-xl p-4">
            <span className="block text-[10px] uppercase tracking-widest text-brand-accent font-semibold">Rol</span>
            <span className="mt-1 block text-lg font-semibold">{user.roleName}</span>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <span className="block text-[10px] uppercase tracking-widest text-brand-accent font-semibold">URL</span>
            <span className="mt-1 block text-lg font-semibold">/{user.roleSlug}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
