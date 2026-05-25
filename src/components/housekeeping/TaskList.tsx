'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, Loader2, Sparkles, AlertTriangle, Package, X, Check } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface TaskRoom { id: string; name: string; floor: number | null }
interface TaskUser { id: string; firstName: string | null; lastName: string | null; email: string }

interface CleaningTask {
  id: string;
  room: TaskRoom;
  assignedTo: TaskUser | null;
  reportedBy: TaskUser;
  status: string;
  priority: string;
  notes: string | null;
  createdAt: string;
}

interface Props { tr: boolean }

const PRIORITY_STYLE: Record<string, { cls: string; label: string }> = {
  normal: { cls: 'text-muted border-m-border bg-m-surface2', label: 'Normal' },
  urgent: { cls: 'text-red-400  border-red-500/20 bg-red-500/8',   label: 'Acil'   },
};

export function TaskList({ tr }: Props) {
  const toast = useToast();
  const [tasks, setTasks]     = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lostItemTaskId, setLostItemTaskId] = useState<string | null>(null);
  const [lostItemDesc, setLostItemDesc] = useState('');
  const [savingLostItem, setSavingLostItem] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cleaning', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setTasks(data.tasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function updateStatus(task: CleaningTask, status: string) {
    setUpdatingId(task.id);
    try {
      const res = await fetch(`/api/cleaning/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setTasks(prev => prev.map(t => t.id === task.id ? data.task : t));
      if (status === 'done') toast.success(tr ? 'Görev tamamlandı! Oda müsait olarak işaretlendi.' : 'Task complete! Room marked available.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (tr ? 'Hata.' : 'Error.'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function submitLostItem(task: CleaningTask) {
    if (!lostItemDesc.trim()) {
      toast.error(tr ? 'Açıklama zorunludur.' : 'Description is required.');
      return;
    }
    setSavingLostItem(true);
    try {
      const res = await fetch('/api/lost-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: task.room.id, description: lostItemDesc.trim() }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setLostItemTaskId(null);
      setLostItemDesc('');
      toast.success(tr ? 'Kayıp eşya kaydedildi.' : 'Lost item recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (tr ? 'Hata.' : 'Error.'));
    } finally {
      setSavingLostItem(false);
    }
  }

  const pending     = tasks.filter(t => t.status === 'pending');
  const inProgress  = tasks.filter(t => t.status === 'in_progress');
  const done        = tasks.filter(t => t.status === 'done');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-brand-accent/50" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-faint">
        <Sparkles size={32} />
        <p className="text-sm">{tr ? 'Size atanmış görev yok.' : 'No tasks assigned to you.'}</p>
      </div>
    );
  }

  function renderTask(task: CleaningTask) {
    const pr = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.normal;
    const isUpdating = updatingId === task.id;
    const isDone = task.status === 'done';

    return (
      <div
        key={task.id}
        className={`rounded-2xl border px-4 py-4 transition-all ${
          task.priority === 'urgent'
            ? 'border-red-500/20 bg-red-500/[0.04]'
            : 'border-m-border bg-m-surface'
        } ${isDone ? 'opacity-50' : ''}`}
      >
        {/* Row: info + buttons */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {task.priority === 'urgent' && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
              <span className="text-sm font-bold text-main">
                {task.room.name}
                {task.room.floor != null && <span className="text-subtle font-normal ml-1.5 text-xs">· Kat {task.room.floor}</span>}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pr.cls}`}>
                {pr.label}
              </span>
            </div>
            {task.notes && (
              <p className="text-[11px] text-muted mt-1.5 italic">"{task.notes}"</p>
            )}
            <p className="text-[10px] text-subtle mt-1.5 tabular-nums">
              {new Date(task.createdAt).toLocaleTimeString(tr ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUpdating ? (
              <Loader2 size={16} className="animate-spin text-subtle" />
            ) : isDone ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <>
                {/* Kayıp Eşya — her zaman görünür (pending ve in_progress için) */}
                <button
                  onClick={() => {
                    setLostItemTaskId(lostItemTaskId === task.id ? null : task.id);
                    setLostItemDesc('');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    lostItemTaskId === task.id
                      ? 'text-amber-400 border border-amber-400/30 bg-amber-400/12'
                      : 'text-amber-400/60 border border-amber-400/15 bg-amber-400/4 hover:bg-amber-400/10 hover:text-amber-400'
                  }`}
                >
                  <Package size={11} />
                  {tr ? 'Kayıp Eşya' : 'Lost Item'}
                </button>

                {/* Tek dinamik aksiyon butonu: Başla → Bitti */}
                {task.status === 'pending' ? (
                  <button
                    onClick={() => updateStatus(task, 'in_progress')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-400 border border-sky-400/20 bg-sky-400/6 hover:bg-sky-400/12 transition-colors"
                  >
                    <Clock size={11} />
                    {tr ? 'Başla' : 'Start'}
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus(task, 'done')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-400/20 bg-emerald-400/6 hover:bg-emerald-400/12 transition-colors"
                  >
                    <CheckCircle2 size={11} />
                    {tr ? 'Bitti' : 'Done'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lost item inline form */}
        {lostItemTaskId === task.id && (
          <div className="mt-3 pt-3 border-t border-m-border space-y-2">
            <textarea
              value={lostItemDesc}
              onChange={e => setLostItemDesc(e.target.value)}
              rows={2}
              placeholder={tr ? 'Eşyanın tanımı (renk, marka, tür...)' : 'Item description (color, brand, type...)'}
              className="control-base px-3 py-2 text-xs resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => submitLostItem(task)}
                disabled={savingLostItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-400/20 bg-emerald-400/6 hover:bg-emerald-400/12 transition-colors"
              >
                {savingLostItem ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                {tr ? 'Kaydet' : 'Save'}
              </button>
              <button
                onClick={() => { setLostItemTaskId(null); setLostItemDesc(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted border border-m-border hover:bg-m-hover transition-colors"
              >
                <X size={10} />
                {tr ? 'İptal' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: tr ? 'Bekliyor'     : 'Pending',     value: pending.length,    cls: 'text-amber-400'   },
          { label: tr ? 'Devam Ediyor' : 'In Progress', value: inProgress.length, cls: 'text-sky-400'     },
          { label: tr ? 'Tamamlandı'   : 'Done',        value: done.length,       cls: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="surface-card px-3 py-2.5">
            <p className={`text-xl font-black tabular-nums leading-none ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-subtle mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Urgent first */}
      {[...pending, ...inProgress]
        .sort((a, b) => (b.priority === 'urgent' ? 1 : 0) - (a.priority === 'urgent' ? 1 : 0))
        .map(renderTask)
      }

      {/* Done section */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-subtle uppercase tracking-widest px-1">{tr ? 'Tamamlananlar' : 'Completed'}</p>
          {done.map(renderTask)}
        </div>
      )}
    </div>
  );
}
