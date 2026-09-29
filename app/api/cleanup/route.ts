import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const now = new Date().toISOString();

    // 1. Cari sesi yang sudah kadaluarsa (> 14 hari)
    const { data: expiredSessions, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, slug')
      .lt('expires_at', now);

    if (sessionErr) throw sessionErr;
    if (!expiredSessions || expiredSessions.length === 0) {
      return NextResponse.json({ message: 'Tidak ada sesi kadaluarsa.', deletedCount: 0 });
    }

    let deletedSessionsCount = 0;

    for (const session of expiredSessions) {
      // 2. Ambil semua file foto dari sesi ini
      const { data: files } = await supabase.storage.from('thumbnails').list(session.id);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${session.id}/${f.name}`);
        // Hapus fisik foto dari bucket Storage agar storage 1 GB tetap lega
        await supabase.storage.from('thumbnails').remove(filePaths);
      }

      // 3. Hapus data sesi dari database (tabel photos otomatis ikut terhapus via cascade)
      await supabase.from('sessions').delete().eq('id', session.id);
      deletedSessionsCount++;
    }

    return NextResponse.json({
      message: 'Pembersihan otomatis selesai.',
      deletedCount: deletedSessionsCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}