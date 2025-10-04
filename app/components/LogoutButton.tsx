'use client';
import { supabaseClient } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await supabaseClient().auth.signOut();       // client session
      await fetch('/api/auth/logout', { method: 'POST' }); // server cookie
      window.location.assign('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-3 py-2 rounded bg-neutral-200 hover:bg-neutral-300"
      title="Çıkış"
    >
      {loading ? 'Çıkılıyor…' : 'Çıkış'}
    </button>
  );
}
