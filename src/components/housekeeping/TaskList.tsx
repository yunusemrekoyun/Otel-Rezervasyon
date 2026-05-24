'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
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
  normal: { cls: 'text-white/40 border-white/10 bg-white/[0.03]', label: 'Normal' },
  urgent: { cls: 'text-red-400  border-red-500/20 bg-red-500/8',   label: 'Acil'   },
};

export function TaskList({ tr }: Props) {
  const toast = useToast();
  const [tasks, setTasks]     = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/20">
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
        className={`rounded-2xl border px-4 py-4 flex items-start gap-4 transition-all ${
          task.priority === 'urgent'
            ? 'border-red-500/20 bg-red-500/[0.04]'
            : 'border-white/[0.07] bg-white/[0.02]'
        } ${isDone ? 'opacity-50' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.priority === 'urgent' && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
            <span className="text-sm font-bold text-white/90">
              {task.room.name}
              {task.room.floor != null && <span className="text-white/30 font-normal ml-1.5 text-xs">· Kat {task.room.floor}</span>}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pr.cls}`}>
              {pr.label}
            </span>
          </div>
          {task.notes && (
            <p className="text-[11px] text-white/35 mt-1.5 italic">"{task.notes}"</p>
          )}
          <p className="text-[10px] text-white/20 mt-1.5 tabular-nums">
            {new Date(task.createdAt).toLocaleTimeString(tr ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isUpdating ? (
            <Loader2 size={16} className="animate-spin text-white/30" />
          ) : isDone ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <>
              {task.status === 'pending' && (
                <button
                  onClick={() => updateStatus(task, 'in_progress')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-400 border border-sky-400/20 bg-sky-400/6 hover:bg-sky-400/12 transition-colors"
                >
                  <Clock size={11} />
                  {tr ? 'Başla' : 'Start'}
                </button>
              )}
              <button
                onClick={() => updateStatus(task, 'done')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-400/20 bg-emerald-400/6 hover:bg-emerald-400/12 transition-colors"
              >
                <CheckCircle2 size={11} />
                {tr ? 'Bitti' : 'Done'}
              </button>
            </>
          )}
        </div>
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
          <div key={s.label} className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5">
            <p className={`text-xl font-black tabular-nums leading-none ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-white/28 mt-1">{s.label}</p>
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
          <p className="text-[10px] text-white/20 uppercase tracking-widest px-1">{tr ? 'Tamamlananlar' : 'Completed'}</p>
          {done.map(renderTask)}
        </div>
      )}
    </div>
  );
}
