'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Check,
  Heart,
  Maximize2,
  X,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Filter,
  MessageSquareQuote,
  Send,
  Clock,
} from 'lucide-react';

export default function GalleryPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [session, setSession] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<{ [photoId: string]: string }>({});
  const [activePhoto, setActivePhoto] = useState<any | null>(null);
  const [currentNoteInput, setCurrentNoteInput] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'selected'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Masukkan nomor WhatsApp kamu di sini (format 628xxx tanpa tanda +)
  const PHOTOGRAPHER_WA = '62895405090125';

  useEffect(() => {
    if (slug) fetchGalleryData();
  }, [slug]);

  const fetchGalleryData = async () => {
    const { data: sessionData } = await supabase.from('sessions').select('*').eq('slug', slug).single();

    if (sessionData) {
      setSession(sessionData);
      setSubmitted(sessionData.is_submitted);

      
      const { data: photoData } = await supabase
        .from('photos')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('file_name', { ascending: true });

      if (photoData) {
        setPhotos(photoData);
        const alreadySelected = new Set<string>(
          photoData.filter((p: any) => p.is_selected).map((p: any) => p.id)
        );
        setSelectedIds(alreadySelected);

        const loadedNotes: { [photoId: string]: string } = {};
        photoData.forEach((p: any) => {
          if (p.notes) loadedNotes[p.id] = p.notes;
        });
        setNotes(loadedNotes);
      }
    }
  };

  const toggleSelect = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (submitted) return;

    const newSelection = new Set(selectedIds);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      if (newSelection.size >= (session?.photo_limit || 20)) {
        return alert(`Batas kuota kamu adalah ${session?.photo_limit} foto ya!`);
      }
      newSelection.add(photoId);
    }
    setSelectedIds(newSelection);
  };

  const handleSaveNote = async () => {
    if (!activePhoto) return;
    const updatedNotes = { ...notes, [activePhoto.id]: currentNoteInput };
    setNotes(updatedNotes);

    // Otomatis tandai foto jika diberi catatan
    if (!selectedIds.has(activePhoto.id)) {
      const newSelection = new Set(selectedIds);
      newSelection.add(activePhoto.id);
      setSelectedIds(newSelection);
    }

    await supabase.from('photos').update({ notes: currentNoteInput }).eq('id', activePhoto.id);
    alert('Catatan tersimpan!');
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return alert('Pilih minimal 1 foto terlebih dahulu!');
    setSubmitting(true);

    try {
      await supabase.from('photos').update({ is_selected: false }).eq('session_id', session.id);
      const idsArray = Array.from(selectedIds);
      await supabase.from('photos').update({ is_selected: true }).in('id', idsArray);
      await supabase.from('sessions').update({ is_submitted: true }).eq('id', session.id);

      setSubmitted(true);
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `Halo Kak! Saya sudah selesai memilih ${selectedIds.size} foto untuk sesi "${session.client_name}". Mohon dicek ya! Link galeri: /gallery/${session.slug}`
    );
    window.open(`https://wa.me/${PHOTOGRAPHER_WA}?text=${text}`, '_blank');
  };
// 1. Tampilkan loading jika data belum selesai diambil
  if (!session) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-400 gap-3">
        <div className="w-8 h-8 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Memuat Galeri...</p>
      </div>
    );
  }
// TAMBAHKAN CONSOLE LOG INI UNTUK CEK 👇
  console.log("DATA SESI:", session);
  console.log("EXPIRES_AT:", session.expires_at);

  const expiryDate = session.expires_at
    ? new Date(session.expires_at)
    : new Date(new Date(session.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);

  const isExpired = expiryDate < new Date();
  console.log("EXPIRY DATE:", expiryDate);
  console.log("WAKTU SEKARANG:", new Date());
  console.log("APAKAH EXPIRED?:", isExpired);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0d0d0e] flex flex-col items-center justify-center text-center p-6 text-stone-300">
        <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mb-4 text-amber-400">
          <Clock size={28} />
        </div>
        <h1 className="text-2xl font-serif text-stone-100 mb-2">Masa Pemilihan Telah Berakhir</h1>
        <p className="text-sm text-stone-400 max-w-md mb-6 leading-relaxed">
          Sesi pemilihan foto untuk <strong className="text-stone-200">{session.client_name}</strong> telah melewati batas waktu dan galeri telah dinonaktifkan.
        </p>
        <a
          href={`https://wa.me/${PHOTOGRAPHER_WA}?text=Halo%20kak%2C%20apakah%20sesi%20foto%20saya%20masih%20bisa%20diaktifkan%20kembali%3F`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-4 py-2.5 rounded-xl border border-stone-700 transition"
        >
          Hubungi Fotografer
        </a>
      </div>
    );
  }
  const displayedPhotos =
    viewFilter === 'selected' ? photos.filter((p) => selectedIds.has(p.id)) : photos;

  const progressPercent = Math.min((selectedIds.size / session.photo_limit) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-stone-200 selection:bg-amber-400 selection:text-black">
      {/* Header */}
      <header className="pt-16 pb-10 px-6 text-center border-b border-stone-800/60 bg-gradient-to-b from-stone-900/40 to-transparent">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-800 bg-stone-900/80 text-stone-400 text-xs tracking-widest uppercase mb-4 font-mono">
          <Sparkles size={12} className="text-amber-400" />
          Client Proofing Portal
        </div>
        <h1 className="text-3xl md:text-5xl font-serif tracking-tight text-stone-100 font-normal">
          {session.client_name}
        </h1>
        <p className="text-stone-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
          Ketuk foto untuk memperbesar atau menambahkan catatan khusus. Gunakan ikon hati untuk memilih.
        </p>

        {/* Tab Filter (Semua vs Terpilih) */}
        <div className="inline-flex p-1 bg-stone-900 border border-stone-800 rounded-xl mt-6">
          <button
            onClick={() => setViewFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
              viewFilter === 'all' ? 'bg-stone-800 text-stone-100' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Semua Foto ({photos.length})
          </button>
          <button
            onClick={() => setViewFilter('selected')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              viewFilter === 'selected'
                ? 'bg-amber-400 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Filter size={12} />
            Terpilih ({selectedIds.size})
          </button>
        </div>
      </header>

      {/* Grid Galeri */}
      <main className="max-w-7xl mx-auto px-4 py-8 pb-36">
        {displayedPhotos.length === 0 ? (
          <div className="text-center py-20 text-stone-500 text-sm">
            Belum ada foto yang kamu pilih. Kembali ke tab "Semua Foto" untuk mulai memilih!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {displayedPhotos.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              const hasNote = Boolean(notes[photo.id]);

              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    setActivePhoto(photo);
                    setCurrentNoteInput(notes[photo.id] || '');
                  }}
                  className={`group relative aspect-[3/2] cursor-pointer overflow-hidden rounded-xl bg-stone-900 transition-all duration-300 ring-2 ${
                    isSelected
                      ? 'ring-amber-400 shadow-lg shadow-amber-400/10'
                      : 'ring-transparent hover:ring-stone-700'
                  }`}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.file_name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
                  />

                  {/* Watermark Tipis Elegan */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-white/10 font-mono text-sm tracking-widest uppercase rotate-[-25deg]">
                      PREVIEW ONLY
                    </span>
                  </div>

                  {/* Overlay Gradasi */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Tombol Heart */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(photo.id, e)}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-md ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 scale-105'
                        : 'bg-black/40 text-stone-300 hover:text-white hover:bg-black/60'
                    }`}
                  >
                    {isSelected ? <Check size={18} strokeWidth={3} /> : <Heart size={16} />}
                  </button>

                  {/* Badge Jika Ada Catatan */}
                  {hasNote && (
                    <div className="absolute top-3 left-3 bg-amber-400/90 text-stone-950 p-1.5 rounded-full shadow-md">
                      <MessageSquareQuote size={13} />
                    </div>
                  )}

                  {/* Bar Bawah Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-300 pointer-events-none">
                    <span className="font-mono text-[11px] truncate bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-stone-800">
                      {photo.file_name}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded backdrop-blur-sm">
                      <Maximize2 size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40">
        <div className="bg-stone-900/95 backdrop-blur-xl border border-stone-700/60 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs uppercase tracking-wider text-stone-400 font-mono">Foto Dipilih</span>
              <span className="text-sm font-mono font-medium text-stone-200">
                <span className="text-amber-400 font-bold text-base">{selectedIds.size}</span> / {session.photo_limit}
              </span>
            </div>
            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {submitted ? (
            <button
              onClick={openWhatsAppConfirmation}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-medium px-4 py-2.5 rounded-xl transition text-xs shadow-lg whitespace-nowrap"
            >
              <MessageCircle size={15} />
              Konfirmasi WA
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-medium px-5 py-2.5 rounded-xl transition shadow-md disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {submitting ? 'Menyimpan...' : 'Kirim Pilihan'}
            </button>
          )}
        </div>
      </div>

      {/* Modal Zoom & Kolom Catatan Revisi */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-5 right-5 text-stone-400 hover:text-white p-2 bg-stone-900/80 rounded-full border border-stone-800"
          >
            <X size={20} />
          </button>

          <div
            className="max-w-4xl w-full flex flex-col items-center max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={activePhoto.image_url}
                alt={activePhoto.file_name}
                className="max-h-[60vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-white/10 font-mono text-xl tracking-widest uppercase rotate-[-25deg]">
                  PREVIEW ONLY
                </span>
              </div>
            </div>

            <div className="w-full max-w-xl mt-4 bg-stone-900/90 border border-stone-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-400">{activePhoto.file_name}</span>
                <button
                  onClick={() => toggleSelect(activePhoto.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                    selectedIds.has(activePhoto.id)
                      ? 'bg-amber-400 text-stone-950 font-semibold'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {selectedIds.has(activePhoto.id) ? <Check size={14} /> : <Heart size={14} />}
                  {selectedIds.has(activePhoto.id) ? 'Terpilih' : 'Pilih Foto Ini'}
                </button>
              </div>

              {/* Form Input Catatan Khusus */}
              <div className="pt-2 border-t border-stone-800">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                  Catatan Edit Khusus (Opsional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Tolong hilangkan orang di latar belakang / jerawat..."
                    value={currentNoteInput}
                    onChange={(e) => setCurrentNoteInput(e.target.value)}
                    className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Send size={12} />
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}