'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Loader2, DoorOpen, BedDouble, X, ImagePlus, Film, Pencil, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';

// ── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  originalName: string;
  mimeType: string;
  pathOriginal: string;
  pathThumb: string | null;
  pathMedium: string | null;
  isProcessed: boolean;
}

interface PendingItem {
  file: File;
  objectUrl: string;
}

interface RoomType {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  floor: number | null;
  status: string;
  basePrice: number;
  description: string | null;
  isActive: boolean;
  roomTypeId: string;
  maxAdults: number;
  maxChildren: number;
  roomType: { id: string; name: string };
  media: MediaItem[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TAG: Record<string, string> = {
  available:   'tag tag-success',
  occupied:    'tag tag-info',
  cleaning:    'tag tag-warning',
  maintenance: 'tag tag-danger',
};

const STATUS_LABEL: Record<string, { tr: string; en: string }> = {
  available:   { tr: 'Müsait',   en: 'Available'   },
  occupied:    { tr: 'Dolu',     en: 'Occupied'     },
  cleaning:    { tr: 'Temizlik', en: 'Cleaning'     },
  maintenance: { tr: 'Bakım',    en: 'Maintenance'  },
};

const STATUS_OPTIONS = ['available', 'occupied', 'cleaning', 'maintenance'];

const STATUS_STYLE: Record<string, { dot: string; text: string; border: string; glow: string }> = {
  available:   { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/35', glow: 'rgba(52,211,153,0.15)'  },
  occupied:    { dot: 'bg-sky-400',     text: 'text-sky-400',     border: 'border-sky-500/35',     glow: 'rgba(56,189,248,0.15)'  },
  cleaning:    { dot: 'bg-amber-400',   text: 'text-amber-400',   border: 'border-amber-500/35',   glow: 'rgba(251,191,36,0.15)'  },
  maintenance: { dot: 'bg-red-400',     text: 'text-red-400',     border: 'border-red-500/35',     glow: 'rgba(248,113,113,0.15)' },
};

// ── Status Dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({
  roomId,
  status,
  onChange,
  tr,
}: {
  roomId: string;
  status: string;
  onChange: (id: string, newStatus: string) => void;
  tr: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.available;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">

      {/* Trigger pill */}
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${style.text} ${style.border}`}
        style={{
          background: `linear-gradient(135deg, ${style.glow} 0%, rgba(0,0,0,0.65) 100%)`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot} shadow-[0_0_4px_currentColor]`} />
        {tr ? STATUS_LABEL[status]?.tr : STATUS_LABEL[status]?.en}
        <ChevronDown
          size={9}
          className={`ml-0.5 opacity-60 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 min-w-[148px] rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ background: '#141618', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {STATUS_OPTIONS.map(s => {
            const st = STATUS_STYLE[s];
            const isActive = s === status;
            return (
              <button
                key={s}
                onClick={e => { e.stopPropagation(); onChange(roomId, s); setOpen(false); }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-semibold
                  transition-colors text-left
                  ${isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]'}
                `}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                <span className={st.text}>
                  {tr ? STATUS_LABEL[s].tr : STATUS_LABEL[s].en}
                </span>
                {isActive && <Check size={11} className="ml-auto text-white/30 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function RoomManager({ viewMode = 'list' }: { viewMode?: 'card' | 'list' }) {
  const { language } = useLanguage();
  const tr = language === 'tr';
  const toast = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Create form state ─────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [floor, setFloor] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('available');
  const [maxAdults, setMaxAdults] = useState('2');
  const [maxChildren, setMaxChildren] = useState('0');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoomTypeId, setEditRoomTypeId] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('available');
  const [editMaxAdults, setEditMaxAdults] = useState('2');
  const [editMaxChildren, setEditMaxChildren] = useState('0');
  const [editPendingItems, setEditPendingItems] = useState<PendingItem[]>([]);
  const [saving, setSaving] = useState(false);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, typesRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/room-types'),
      ]);
      const [roomsData, typesData] = await Promise.all([
        roomsRes.json(),
        typesRes.json(),
      ]);
      if (roomsData.ok) setRooms(roomsData.rooms);
      if (typesData.ok) setRoomTypes(typesData.roomTypes);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Create handlers ────────────────────────────────────────────────────────

  const resetForm = () => {
    setShowForm(false);
    setName('');
    setRoomTypeId('');
    setFloor('');
    setBasePrice('');
    setDescription('');
    setStatus('available');
    setMaxAdults('2');
    setMaxChildren('0');
    setPendingItems(prev => {
      prev.forEach(item => { if (item.objectUrl) URL.revokeObjectURL(item.objectUrl); });
      return [];
    });
  };

  const handleFormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newItems: PendingItem[] = Array.from(files).map(file => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setPendingItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removePendingItem = (index: number) => {
    setPendingItems(prev => {
      const item = prev[index];
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || !roomTypeId || !basePrice) return;
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          roomTypeId,
          floor: floor ? parseInt(floor, 10) : undefined,
          basePrice: parseInt(basePrice, 10),
          description: description.trim() || undefined,
          status,
          maxAdults: parseInt(maxAdults, 10) || 2,
          maxChildren: parseInt(maxChildren, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!data.ok) return;

      const newRoom: Room = { ...data.room, media: [] };

      if (pendingItems.length > 0) {
        const uploadedMedia: MediaItem[] = [];
        for (const item of pendingItems) {
          const fd = new FormData();
          fd.append('file', item.file);
          fd.append('entityType', 'room');
          fd.append('entityId', newRoom.id);
          try {
            const r = await fetch('/api/media/upload', { method: 'POST', body: fd });
            const d = await r.json();
            if (d.ok) uploadedMedia.push(d.media);
          } catch { /* silent */ }
        }
        newRoom.media = uploadedMedia;
      }

      setRooms(prev => [...prev, newRoom]);
      resetForm();
      toast.success(tr ? 'Oda eklendi' : 'Room added', newRoom.name);
    } catch (err) {
      console.error('Failed to create room:', err);
      toast.error(tr ? 'Oluşturma başarısız' : 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setEditName(room.name);
    setEditRoomTypeId(room.roomTypeId);
    setEditFloor(room.floor != null ? String(room.floor) : '');
    setEditBasePrice(String(room.basePrice));
    setEditDescription(room.description ?? '');
    setEditStatus(room.status);
    setEditMaxAdults(String(room.maxAdults));
    setEditMaxChildren(String(room.maxChildren));
    setEditPendingItems([]);
  };

  const closeEdit = () => {
    setEditPendingItems(prev => {
      prev.forEach(item => { if (item.objectUrl) URL.revokeObjectURL(item.objectUrl); });
      return [];
    });
    setEditingRoom(null);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newItems: PendingItem[] = Array.from(files).map(file => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setEditPendingItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeEditPendingItem = (index: number) => {
    setEditPendingItems(prev => {
      const item = prev[index];
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRoom || !editName.trim() || !editRoomTypeId || !editBasePrice) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          roomTypeId: editRoomTypeId,
          floor: editFloor ? parseInt(editFloor, 10) : null,
          basePrice: parseInt(editBasePrice, 10),
          description: editDescription.trim() || null,
          status: editStatus,
          maxAdults: parseInt(editMaxAdults, 10) || 2,
          maxChildren: parseInt(editMaxChildren, 10) || 0,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        let updatedMedia = editingRoom.media;
        if (editPendingItems.length > 0) {
          const uploadedMedia: MediaItem[] = [];
          for (const item of editPendingItems) {
            const fd = new FormData();
            fd.append('file', item.file);
            fd.append('entityType', 'room');
            fd.append('entityId', editingRoom.id);
            try {
              const r = await fetch('/api/media/upload', { method: 'POST', body: fd });
              const d = await r.json();
              if (d.ok) uploadedMedia.push(d.media);
            } catch { /* silent */ }
          }
          updatedMedia = [...updatedMedia, ...uploadedMedia];
        }
        setRooms(prev =>
          prev.map(r => r.id === editingRoom.id ? { ...r, ...data.room, media: updatedMedia } : r)
        );
        closeEdit();
        toast.success(tr ? 'Değişiklikler kaydedildi' : 'Changes saved');
      } else {
        toast.error(tr ? 'Kaydetme başarısız' : 'Save failed');
      }
    } catch (err) {
      console.error('Failed to update room:', err);
      toast.error(tr ? 'Kaydetme başarısız' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete handlers ────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/rooms/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setRooms(prev => prev.filter(r => r.id !== deleteTarget.id));
        toast.success(tr ? 'Oda silindi' : 'Room deleted', deleteTarget.name);
        setDeleteTarget(null);
      } else {
        toast.error(tr ? 'Silme başarısız' : 'Delete failed');
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
      toast.error(tr ? 'Silme başarısız' : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    try {
      await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch { /* silent */ }
  };

  // ── Media handlers ─────────────────────────────────────────────────────────

  const handleDeleteMedia = async (mediaId: string, roomId: string) => {
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setRooms(prev =>
          prev.map(r => r.id === roomId ? { ...r, media: r.media.filter(m => m.id !== mediaId) } : r)
        );
        if (editingRoom?.id === roomId) {
          setEditingRoom(prev => prev ? { ...prev, media: prev.media.filter(m => m.id !== mediaId) } : null);
        }
      }
    } catch { /* silent */ }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-accent/50" size={28} />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">
            {tr
              ? `${rooms.length} oda kayıtlı`
              : `${rooms.length} room${rooms.length !== 1 ? 's' : ''} registered`}
          </p>
          <p className="section-title mt-0.5">
            {tr ? 'Oda durumlarını ve bilgilerini yönetin' : 'Manage room statuses and details'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-card text-sm"
        >
          <Plus size={15} />
          {tr ? 'Yeni Oda Ekle' : 'Add New Room'}
        </button>
      </div>

      {/* ── Create Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={tr ? 'Yeni Oda Ekle' : 'Add New Room'}
        description={tr ? 'Odanın bilgilerini girin ve bir oda çeşidine atayın' : 'Enter room details and assign to a room type'}
      >
        <RoomFormFields
          tr={tr}
          name={name} setName={setName}
          roomTypeId={roomTypeId} setRoomTypeId={setRoomTypeId}
          floor={floor} setFloor={setFloor}
          basePrice={basePrice} setBasePrice={setBasePrice}
          description={description} setDescription={setDescription}
          status={status} setStatus={setStatus}
          maxAdults={maxAdults} setMaxAdults={setMaxAdults}
          maxChildren={maxChildren} setMaxChildren={setMaxChildren}
          roomTypes={roomTypes}
          pendingItems={pendingItems}
          onFileChange={handleFormFileChange}
          onRemovePendingItem={removePendingItem}
          onSubmit={handleCreate}
          onCancel={resetForm}
          submitting={creating}
          isNew
        />
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!editingRoom}
        onClose={closeEdit}
        title={tr ? 'Odayı Düzenle' : 'Edit Room'}
        description={editingRoom?.name}
      >
        {editingRoom && (
          <RoomFormFields
            tr={tr}
            name={editName} setName={setEditName}
            roomTypeId={editRoomTypeId} setRoomTypeId={setEditRoomTypeId}
            floor={editFloor} setFloor={setEditFloor}
            basePrice={editBasePrice} setBasePrice={setEditBasePrice}
            description={editDescription} setDescription={setEditDescription}
            status={editStatus} setStatus={setEditStatus}
            maxAdults={editMaxAdults} setMaxAdults={setEditMaxAdults}
            maxChildren={editMaxChildren} setMaxChildren={setEditMaxChildren}
            roomTypes={roomTypes}
            pendingItems={editPendingItems}
            onFileChange={handleEditFileChange}
            onRemovePendingItem={removeEditPendingItem}
            existingMedia={editingRoom.media}
            onDeleteExistingMedia={(mediaId) => handleDeleteMedia(mediaId, editingRoom.id)}
            onSubmit={handleSaveEdit}
            onCancel={closeEdit}
            submitting={saving}
            isNew={false}
          />
        )}
      </Modal>

      {/* ── Delete confirmation modal ─────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={tr ? 'Odayı Sil' : 'Delete Room'}
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {tr ? `"${deleteTarget.name}" odası silinecek.` : `Room "${deleteTarget.name}" will be deleted.`}
                </p>
                <p className="text-[11px] text-red-400/70 mt-1 leading-relaxed">
                  {tr ? 'Bu oda ve varsa medya dosyaları kalıcı olarak silinir.' : 'This room and any associated media will be permanently deleted.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-card text-sm font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletingId && <Loader2 size={14} className="animate-spin" />}
                {tr ? 'Evet, sil' : 'Yes, delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-5 py-2.5 rounded-card text-sm">
                {tr ? 'İptal' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Empty state ───────────────────────────────────────── */}
      {rooms.length === 0 && (
        <div className="panel-glass-dashed">
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-surface-glass border border-border-glass flex items-center justify-center">
              <DoorOpen size={28} className="text-white/20" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-white/45">
                {tr ? 'Henüz oda eklenmedi' : 'No rooms added yet'}
              </p>
              <p className="text-xs text-white/25 max-w-xs leading-relaxed">
                {tr ? 'İlk odanızı eklemek için yukarıdaki butona tıklayın.' : 'Click the button above to add your first room.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Room list / card view ─────────────────────────────── */}
      {rooms.length > 0 && (viewMode === 'card' ? (

        /* ══ CARD GRID ══ */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.map(room => {
            const cover = room.media[0];
            const coverSrc = cover
              ? (cover.pathThumb ? `/uploads/${cover.pathThumb}` : `/uploads/${cover.pathOriginal}`)
              : null;
            const coverIsVideo = cover?.mimeType.startsWith('video/') ?? false;

            return (
              <div
                key={room.id}
                className="rounded-2xl overflow-hidden border border-white/8 group hover:border-brand-accent/25 transition-all duration-200 flex flex-col"
                style={{ background: '#0d0f13' }}
              >
                {/* Cover */}
                <div className="relative shrink-0" style={{ aspectRatio: '5/2' }}>
                  {coverSrc ? (
                    coverIsVideo ? (
                      <video src={`/uploads/${cover!.pathOriginal}`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverSrc} alt={room.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent) 12%, #0d0f13) 0%, #0d0f13 100%)' }}
                    >
                      <BedDouble size={24} className="text-brand-accent/25" />
                      <span className="font-mono font-black text-lg text-white/10 tracking-widest">{room.name}</span>
                    </div>
                  )}

                  {/* Status dropdown — top left */}
                  <div className="absolute top-2.5 left-2.5">
                    <StatusDropdown
                      roomId={room.id}
                      status={room.status}
                      onChange={handleStatusChange}
                      tr={tr}
                    />
                  </div>

                  {/* Edit / Delete — top right, hover */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(room)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <Pencil size={12} />
                    </button>
                    {deletingId === room.id ? (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <Loader2 size={12} className="animate-spin text-white/40" />
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteTarget(room)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-red-400 transition-colors"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Media count badge — bottom right */}
                  {room.media.length > 0 && (
                    <div
                      className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white/60"
                      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <ImagePlus size={9} />
                      {room.media.length}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-3 border-t border-white/[0.06]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white/95 text-base leading-none truncate">{room.name}</h3>
                      <p className="text-[11px] text-white/35 mt-1 truncate">
                        {room.roomType.name}
                        {room.floor != null ? ` · Kat ${room.floor}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-brand-accent leading-none">
                        ₺{room.basePrice.toLocaleString('tr-TR')}
                      </p>
                      <p className="text-[9px] text-white/25 mt-0.5">/{tr ? 'gece' : 'night'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="tag tag-muted">
                      {room.maxAdults}{tr ? 'y' : 'a'}
                      {room.maxChildren > 0 ? ` + ${room.maxChildren}${tr ? 'ç' : 'c'}` : ''}
                    </span>
                    {!room.isActive && (
                      <span className="tag tag-danger">{tr ? 'Pasif' : 'Inactive'}</span>
                    )}
                    {room.description && (
                      <span className="tag tag-muted text-white/20 italic truncate max-w-[120px]">{room.description}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ══ LIST VIEW (mevcut) ══ */
        <div className="space-y-4">
          {rooms.map(room => (
            <div key={room.id} className="panel-glass-raised">

              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent) 6%, transparent) 0%, transparent 60%)' }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
                    <BedDouble size={18} className="text-brand-accent" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white/95 truncate">{room.name}</h3>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {room.roomType.name}
                      {room.floor != null && ` · ${room.floor}. ${tr ? 'Kat' : 'Floor'}`}
                      {' · '}₺{room.basePrice.toLocaleString('tr-TR')}/{tr ? 'gece' : 'night'}
                      {' · '}{room.maxAdults} {tr ? 'yetişkin' : 'adult'}{room.maxChildren > 0 ? ` + ${room.maxChildren} ${tr ? 'çocuk' : 'child'}` : ''}
                      {' · '}{room.media.length} {tr ? 'medya' : 'media'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <select
                    value={room.status}
                    onChange={e => handleStatusChange(room.id, e.target.value)}
                    className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 border cursor-pointer focus:outline-none transition-colors ${STATUS_TAG[room.status] ?? 'tag tag-muted'}`}
                    style={{ background: 'transparent' }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} style={{ background: '#0f1115', color: '#fff' }}>
                        {tr ? STATUS_LABEL[s].tr : STATUS_LABEL[s].en}
                      </option>
                    ))}
                  </select>

                  <button onClick={() => openEdit(room)} className="btn-secondary px-3 py-1.5 rounded-lg text-xs gap-1.5">
                    <Pencil size={13} />
                    {tr ? 'Düzenle' : 'Edit'}
                  </button>

                  {deletingId === room.id ? (
                    <Loader2 size={14} className="animate-spin text-white/30" />
                  ) : (
                    <button
                      onClick={() => setDeleteTarget(room)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {room.description && (
                <div className="px-5 py-3 border-t border-white/[0.06]">
                  <p className="text-[12px] text-white/40 leading-relaxed">{room.description}</p>
                </div>
              )}

              {room.media.length > 0 && (
                <div className="px-5 pb-5 pt-3 border-t border-white/[0.06]">
                  <p className="section-title mb-3">{tr ? 'Medya' : 'Media'}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {room.media.map(m => {
                      const isVideo = m.mimeType.startsWith('video/');
                      const src = m.pathThumb ? `/uploads/${m.pathThumb}` : `/uploads/${m.pathOriginal}`;
                      return (
                        <div key={m.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/30">
                          {isVideo ? (
                            <video src={`/uploads/${m.pathOriginal}`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt={m.originalName} className="w-full h-full object-cover" />
                          )}
                          <button
                            onClick={() => handleDeleteMedia(m.id, room.id)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                          >
                            <Trash2 size={11} className="text-white" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

      ))}

    </div>
  );
}

// ── Shared form fields component ──────────────────────────────────────────────

function RoomFormFields({
  tr, name, setName, roomTypeId, setRoomTypeId, floor, setFloor,
  basePrice, setBasePrice, description, setDescription, status, setStatus,
  maxAdults, setMaxAdults, maxChildren, setMaxChildren,
  roomTypes, pendingItems, onFileChange, onRemovePendingItem,
  existingMedia, onDeleteExistingMedia,
  onSubmit, onCancel, submitting, isNew,
}: {
  tr: boolean;
  name: string; setName: (v: string) => void;
  roomTypeId: string; setRoomTypeId: (v: string) => void;
  floor: string; setFloor: (v: string) => void;
  basePrice: string; setBasePrice: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  maxAdults: string; setMaxAdults: (v: string) => void;
  maxChildren: string; setMaxChildren: (v: string) => void;
  roomTypes: RoomType[];
  pendingItems: PendingItem[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePendingItem: (i: number) => void;
  existingMedia?: MediaItem[];
  onDeleteExistingMedia?: (mediaId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  isNew: boolean;
}) {
  const hasMedia = (existingMedia?.length ?? 0) > 0 || pendingItems.length > 0;

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="label-sm">{tr ? 'Oda Adı / No' : 'Room Name / No'}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={tr ? 'Örn: 101, Sultan Suite...' : 'e.g. 101, Sultan Suite...'} className="input-base" autoFocus />
        </div>
        <div className="space-y-2">
          <label className="label-sm">{tr ? 'Kat (opsiyonel)' : 'Floor (optional)'}</label>
          <input type="number" value={floor} onChange={e => setFloor(e.target.value)} placeholder={tr ? 'Örn: 1, 2, 3...' : 'e.g. 1, 2, 3...'} className="input-base" min={0} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="label-sm">{tr ? 'Oda Çeşidi' : 'Room Type'}</label>
        {roomTypes.length === 0 ? (
          <div className="input-base text-white/30 text-sm">{tr ? 'Önce bir oda çeşidi oluşturun.' : 'Create a room type first.'}</div>
        ) : (
          <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} className="input-base">
            <option value="" disabled style={{ background: '#0f1115' }}>{tr ? '— Bir çeşit seçin —' : '— Select a type —'}</option>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id} style={{ background: '#0f1115' }}>{rt.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="label-sm">{tr ? 'Gecelik Fiyat (₺)' : 'Base Price (₺)'}</label>
          <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0" className="input-base" min={0} />
        </div>
        <div className="space-y-2">
          <label className="label-sm">{tr ? 'Durum' : 'Status'}</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-base">
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} style={{ background: '#0f1115' }}>
                {tr ? STATUS_LABEL[s].tr : STATUS_LABEL[s].en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="label-sm">{tr ? 'Maks. Yetişkin' : 'Max Adults'}</label>
          <input type="number" value={maxAdults} onChange={e => setMaxAdults(e.target.value)} className="input-base" min={1} max={10} placeholder="2" />
        </div>
        <div className="space-y-2">
          <label className="label-sm">{tr ? 'Maks. Çocuk (0 = kabul edilmez)' : 'Max Children (0 = not allowed)'}</label>
          <input type="number" value={maxChildren} onChange={e => setMaxChildren(e.target.value)} className="input-base" min={0} max={10} placeholder="0" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="label-sm">{tr ? 'Açıklama (opsiyonel)' : 'Description (optional)'}</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={tr ? 'Odaya özel notlar...' : 'Room-specific notes...'} className="input-base resize-none h-20" />
      </div>

      {/* ── Media section ─────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="label-sm">{tr ? 'Medya' : 'Media'}</label>

        {hasMedia && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {existingMedia?.map(m => {
              const isVideo = m.mimeType.startsWith('video/');
              const src = m.pathThumb ? `/uploads/${m.pathThumb}` : `/uploads/${m.pathOriginal}`;
              return (
                <div key={m.id} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0 group">
                  {isVideo ? (
                    <video src={`/uploads/${m.pathOriginal}`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={m.originalName} className="w-full h-full object-cover" />
                  )}
                  {onDeleteExistingMedia && (
                    <button
                      type="button"
                      onClick={() => onDeleteExistingMedia(m.id)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
                    >
                      <X size={8} className="text-white" />
                    </button>
                  )}
                </div>
              );
            })}

            {pendingItems.map((item, i) => {
              const isVideo = item.file.type.startsWith('video/');
              return (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0 ring-1 ring-brand-accent/30">
                  {isVideo ? (
                    <video src={item.objectUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.objectUrl} alt={item.file.name} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemovePendingItem(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X size={8} className="text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <label className="btn-secondary w-full py-3 rounded-xl border-dashed gap-2 text-sm text-white/40 hover:text-white/60 cursor-pointer flex items-center justify-center">
          <ImagePlus size={15} />
          {hasMedia ? (tr ? 'Daha fazla ekle' : 'Add more') : (tr ? 'Fotoğraf veya video seç' : 'Select photos or videos')}
          <input type="file" className="sr-only" accept="image/*,video/*" multiple onChange={onFileChange} />
        </label>

        {isNew && (
          <p className="text-[10px] text-white/20">
            {tr ? 'Oda oluşturulunca dosyalar otomatik yüklenir.' : 'Files upload automatically after creation.'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onSubmit}
          disabled={submitting || !name.trim() || !roomTypeId || !basePrice || !maxAdults}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-card text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting
            ? (isNew && pendingItems.length > 0
                ? (tr ? 'Oluşturuluyor ve yükleniyor...' : 'Creating & uploading...')
                : (tr ? (isNew ? 'Oluşturuluyor...' : 'Kaydediliyor...') : (isNew ? 'Creating...' : 'Saving...')))
            : (isNew ? (tr ? 'Oda Ekle' : 'Add Room') : (tr ? 'Kaydet' : 'Save Changes'))}
        </button>
        <button onClick={onCancel} className="btn-secondary px-5 py-2.5 rounded-card text-sm">
          {tr ? 'İptal' : 'Cancel'}
        </button>
      </div>

    </div>
  );
}
