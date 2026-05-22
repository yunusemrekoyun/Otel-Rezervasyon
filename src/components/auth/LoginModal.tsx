'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, Mail, ShieldCheck, X } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser, redirectTo: string) => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Login failed.');
      }

      onSuccess(payload.user, payload.redirectTo);
      setEmail('');
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md overflow-hidden glass-panel rounded-2xl border border-white/20 select-none text-white shadow-2xl"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-brand-accent h-5 w-5" />
                <h3 className="text-lg font-medium tracking-tight">Login Now</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={15} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full bg-white/5 border border-white/10 text-sm pl-9 pr-3 py-3 rounded-xl text-white focus:outline-none focus:border-brand-accent placeholder:text-white/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={15} />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="yunus123"
                    className="w-full bg-white/5 border border-white/10 text-sm pl-9 pr-3 py-3 rounded-xl text-white focus:outline-none focus:border-brand-accent placeholder:text-white/25"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-accent text-brand-emerald font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shimmer-btn shadow-lg cursor-pointer text-center disabled:opacity-60"
              >
                {isSubmitting ? 'Checking Secure Session...' : 'Enter Secure Role Panel'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
