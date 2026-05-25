'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, MessageSquare, X, Tag } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactReq {
  id: string;
  name: string;
  category: string;
  message: string;
  ticketId: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConciergePanel({ tr: isTr }: { tr: boolean }) {
  const [requests, setRequests] = useState<ContactReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      if (data.ok) setRequests(data.requests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const visible = requests.filter(r => !dismissed.has(r.id));
  const dismissedCount = dismissed.size;

  return (
    <div className="space-y-4 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
            <MessageSquare size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-main leading-none">
              {isTr ? 'Müşteri Talepleri' : 'Customer Requests'}
            </h2>
            <p className="text-[11px] text-subtle mt-0.5">
              {loading
                ? '…'
                : `${visible.length} ${isTr ? 'aktif talep' : 'active requests'}`
                  + (dismissedCount > 0 ? ` · ${dismissedCount} ${isTr ? 'kapatıldı' : 'dismissed'}` : '')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dismissedCount > 0 && (
            <button
              onClick={() => setDismissed(new Set())}
              className="px-3 py-1.5 rounded-lg text-[11px] text-muted hover:text-main bg-m-surface hover:bg-m-hover border border-m-border transition-colors"
            >
              {isTr ? 'Tümünü Göster' : 'Show All'}
            </button>
          )}
          <button
            onClick={fetchRequests}
            className="w-9 h-9 rounded-xl border border-m-border hover:bg-m-hover flex items-center justify-center text-subtle hover:text-main transition-colors"
            title={isTr ? 'Yenile' : 'Refresh'}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-brand-accent' : ''} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw size={20} className="animate-spin text-faint" />
          <span className="text-xs text-subtle">{isTr ? 'Yükleniyor…' : 'Loading…'}</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="panel-glass-dashed">
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl surface-soft flex items-center justify-center">
              <MessageSquare size={22} className="text-faint" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-subtle">
                {dismissedCount > 0
                  ? (isTr ? 'Tüm talepler kapatıldı' : 'All requests dismissed')
                  : (isTr ? 'Henüz müşteri talebi yok' : 'No customer requests yet')}
              </p>
              <p className="text-xs text-faint">
                {isTr
                  ? 'Misafirlerden gelen talepler burada görünecek'
                  : 'Requests from guests will appear here'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {visible.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden', transition: { duration: 0.2 } }}
                className="surface-card p-4 hover:border-m-border2 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-2">

                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-main">{req.name}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-400/8 border border-purple-400/15 text-[10px] text-purple-400 font-medium">
                        <Tag size={8} />
                        {req.category}
                      </span>
                      <span className="font-mono text-[10px] text-subtle bg-m-surface2 px-1.5 py-0.5 rounded-md border border-m-border">
                        {req.ticketId}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-muted leading-relaxed">{req.message}</p>

                    {/* Timestamp */}
                    <p className="text-[10px] text-subtle">{fmtDateTime(req.createdAt)}</p>

                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => dismiss(req.id)}
                    className="w-7 h-7 rounded-lg hover:bg-m-hover flex items-center justify-center text-subtle hover:text-main transition-colors shrink-0 mt-0.5"
                    title={isTr ? 'Kapat' : 'Dismiss'}
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
