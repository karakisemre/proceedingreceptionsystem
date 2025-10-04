'use client';
import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const sb = supabaseClient();

      // 1) Client login
      const { error: signErr } = await sb.auth.signInWithPassword({ email, password });
      if (signErr) { setErr(signErr.message); return; }

      // 2) Session al
      const { data: sessData, error: sessErr } = await sb.auth.getSession();
      if (sessErr || !sessData.session) { setErr('Oturum alınamadı.'); return; }

      // 3) Session'ı server'a yaz (SSR cookie)
      const res = await fetch('/api/auth/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: sessData.session.access_token,
          refresh_token: sessData.session.refresh_token,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error || 'Sunucuya oturum aktarımı başarısız.');
        return;
      }

      // 4) Tam sayfa geçiş (SPA yönlendirme yerine)
      window.location.assign('/admin');
    } catch (e: any) {
      setErr(e?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin Girişi</h1>

      <input
        className="border p-2 w-full rounded"
        placeholder="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 w-full rounded"
        placeholder="Şifre"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </button>
    </form>
  );
}
