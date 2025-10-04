'use client';

import { useState } from 'react';

export default function CreateUserForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j?.error || 'Kullanıcı oluşturulamadı.');
        return;
      }
      setMsg('Kullanıcı oluşturuldu ve admin yapıldı.');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      setErr(e?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <input
        className="border p-2 w-full rounded"
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="border p-2 w-full rounded"
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {busy ? 'Oluşturuluyor…' : 'Oluştur'}
        </button>
        <a href="/admin" className="px-3 py-2 rounded border">Geri dön</a>
      </div>
    </form>
  );
}
