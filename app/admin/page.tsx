'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  UploadCloud,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export default function AdminPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [clientName, setClientName] = useState('');
  const [slug, setSlug] = useState('');
  const [photoLimit, setPhotoLimit] = useState(20);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    document.title = "NOUZZY | Photographer Dashboard";

    fetch('/api/cleanup')
      .then((res) => res.json())
      .then((data) => {
        if (data.deletedCount > 0) {
          console.log(`${data.deletedCount} sesi kadaluarsa berhasil dibersihkan otomatis.`);
        }
      })
      .catch((err) => console.error('Cleanup error:', err))
      .finally(() => fetchSessions());
  }, []);

  const fetchSessions = async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*, photos(id, is_selected)')
      .order('created_at', { ascending: false });

    if (sessionData) {
      setSessions(sessionData);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return alert('Pilih foto JPEG preview terlebih dahulu!');
    setLoading(true);

    try {
      setUploadProgress('Membuat data sesi...');
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);

      // 1. Simpan Sesi
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            client_name: clientName,
            slug: cleanSlug,
            photo_limit: photoLimit,
            expires_at: expiryDate.toISOString(),
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Upload file satu per satu ke storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Mengunggah foto ${i + 1} dari ${files.length}...`);
        const filePath = `${sessionData.id}/${file.name}`;

        const { error: uploadError } = await supabase.storage.from('thumbnails').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('thumbnails').getPublicUrl(filePath);

        await supabase.from('photos').insert([
          {
            session_id: sessionData.id,
            file_name: file.name,
            image_url: publicUrlData.publicUrl,
          },
        ]);
      }

      alert('Sesi foto berhasil dibuat dan semua foto siap dipilih klien!');
      setClientName('');
      setSlug('');
      setFiles(null);
      setUploadProgress('');
      fetchSessions();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const handleCopyLightroom = async (sessionId: string, sessionSlug: string) => {
    const { data: selectedPhotos } = await supabase
      .from('photos')
      .select('file_name, notes')
      .eq('session_id', sessionId)
      .eq('is_selected', true);

    if (!selectedPhotos || selectedPhotos.length === 0) {
      return alert('Belum ada foto yang dipilih oleh klien pada sesi ini.');
    }

    const formatted = selectedPhotos
      .map((p: any) => p.file_name.replace(/\.[^/.]+$/, ''))
      .join(', ');

    navigator.clipboard.writeText(formatted);
    setCopiedSlug(sessionSlug);

    const photosWithNotes = selectedPhotos.filter((p: any) => p.notes && p.notes.trim() !== '');
    if (photosWithNotes.length > 0) {
      const notesSummary = photosWithNotes
        .map((p: any) => `• ${p.file_name}: "${p.notes}"`)
        .join('\n');
      alert(`Nomor file sudah tersalin ke clipboard!\n\nCatatan Khusus Klien:\n${notesSummary}`);
    } else {
      setTimeout(() => setCopiedSlug(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-stone-200 selection:bg-amber-400 selection:text-black p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Dashboard */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-800 bg-stone-900/80 text-stone-400 text-xs tracking-widest uppercase font-mono mb-2">
              <Sparkles size={12} className="text-amber-400" />
              NOUZZY VISUAL STUDIO
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-100">
              Fotografer Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-stone-400 bg-stone-900/70 border border-stone-800 px-4 py-2.5 rounded-xl">
            <Layers size={14} className="text-amber-400" />
            <span>Total {sessions.length} Sesi Terdaftar</span>
          </div>
        </header>

        {/* Form Upload Sesi Baru */}
        <section className="bg-stone-900/50 border border-stone-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <UploadCloud className="text-amber-400" size={20} />
            <h2 className="text-lg font-medium text-stone-100">Buat Sesi Proofing Baru</h2>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-stone-400 mb-2">
                  Nama Sesi / Klien
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sarah Outdoor Portrait"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  required
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-stone-400 mb-2">
                  Custom Slug URL
                </label>
                <input
                  type="text"
                  placeholder="sarah-outdoor-portrait"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 text-sm font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-stone-400 mb-2">
                  Kuota Foto Edit
                </label>
                <input
                  type="number"
                  min={1}
                  value={photoLimit}
                  onChange={(e) => setPhotoLimit(Number(e.target.value))}
                  required
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 text-sm font-mono transition"
                />
              </div>
            </div>

            {/* Area File Input Dropzone */}
            <div className="border-2 border-dashed border-stone-800 hover:border-stone-700 bg-stone-950/60 rounded-xl p-6 text-center transition">
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <ImageIcon className="text-stone-500" size={32} />
                <span className="text-sm font-medium text-stone-200">
                  {files && files.length > 0 ? (
                    <span className="text-amber-400">{files.length} foto terpilih siap diunggah</span>
                  ) : (
                    'Klik di sini untuk memilih foto hasil export preset (1500px JPEG)'
                  )}
                </span>
                <span className="text-xs text-stone-500 font-mono">Bisa pilih ratusan file sekaligus (Ctrl + A)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-medium px-6 py-3 rounded-xl transition shadow-lg shadow-amber-400/10 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>{uploadProgress || 'Mengunggah...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Upload & Terbitkan Galeri</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* List Daftar Sesi */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-stone-100">Daftar Sesi Klien</h2>
          </div>

          <div className="grid gap-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12 border border-stone-800 rounded-xl text-stone-500 text-sm">
                Belum ada sesi foto yang dibuat. Buat sesi pertama kamu di form atas.
              </div>
            ) : (
              sessions.map((s) => {
                const totalPhotos = s.photos?.length || 0;
                const selectedCount = s.photos?.filter((p: any) => p.is_selected).length || 0;
                const isExpired = s.expires_at && new Date(s.expires_at) < new Date();
                const daysLeft = s.expires_at
                  ? Math.max(0, Math.ceil((new Date(s.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : 14;

                return (
                  <div
                    key={s.id}
                    className="bg-stone-900/40 border border-stone-800/80 hover:border-stone-700/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-stone-100 text-base">{s.client_name}</span>
                        {s.is_submitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <CheckCircle2 size={12} /> Selesai Dipilih
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/60">
                            <Clock size={12} /> Menunggu Klien
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-stone-400">
                        <span>Slug: /{s.slug}</span>
                        <span>•</span>
                        <span>Total: {totalPhotos} foto di galeri</span>
                        <span>•</span>
                        <span>
                          Pilihan: <strong className="text-amber-400">{selectedCount}</strong> / {s.photo_limit} kuota
                        </span>
                        <span>•</span>
                        <span className={daysLeft <= 3 ? "text-rose-400 font-semibold" : "text-stone-400"}>
                          Masa Aktif: {isExpired ? 'Kadaluarsa' : `${daysLeft} hari lagi`}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`/gallery/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition"
                      >
                        <ExternalLink size={14} />
                        Buka Galeri
                      </a>

                      <button
                        onClick={() => handleCopyLightroom(s.id, s.slug)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition ${
                          copiedSlug === s.slug
                            ? 'bg-emerald-500 text-stone-950'
                            : 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md shadow-amber-400/5'
                        }`}
                      >
                        {copiedSlug === s.slug ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                        {copiedSlug === s.slug ? 'Nomor Tersalin!' : 'Copy for Lightroom'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}