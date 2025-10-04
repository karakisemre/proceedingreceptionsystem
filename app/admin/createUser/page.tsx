import { redirect } from 'next/navigation';
import { supabaseServerRls } from '@/lib/supabaseServerRls';
import CreateUserForm from './CreateUserForm'; // ← UZANTI YOK, default import

export const dynamic = 'force-dynamic';

export default async function CreateUserPage() {
  const sb = await supabaseServerRls();

  // 1) Login kontrol
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) redirect('/login');

  // 2) Admin mi?
  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profErr || !profile?.is_admin) redirect('/');

  // 3) Sayfa
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Yeni Admin Kullanıcı Oluştur</h1>
      <p className="text-sm text-neutral-600">
        E-posta ve şifre girerek yeni bir kullanıcı açıp admin yetkisi verilecektir.
      </p>
      <CreateUserForm />
    </main>
  );
}
