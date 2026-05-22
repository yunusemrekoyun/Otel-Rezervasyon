'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, Mail, ShieldCheck, X } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/session';
import { useLanguage } from '../../i18n/LanguageContext';

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
  const { t } = useLanguage();

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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md overflow-hidden panel-glass-dashed select-none text-white shadow-2xl"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-brand-accent h-5 w-5" />
                <h3 className="text-lg font-medium tracking-tight">{t('login.title')}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-icon p-1 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <span className="label-sm">{t('login.email')}</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={15} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@gmail.com"
                    className="input-base text-sm pl-9 pr-3 py-3"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="label-sm">{t('login.password')}</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={15} />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="yunus123"
                    className="input-base text-sm pl-9 pr-3 py-3"
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
                className="btn-primary w-full py-3.5 rounded-xl text-center text-xs disabled:opacity-60"
              >
                {isSubmitting ? t('login.submitting') : t('login.submit')}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
