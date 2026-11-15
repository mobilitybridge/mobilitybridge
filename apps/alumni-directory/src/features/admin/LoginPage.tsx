import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import LanguageSwitch from '../../LanguageSwitch';
import { useSession } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const { t } = useTranslation();
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setFailed(Boolean(error));
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t('auth.title')}</h1>
          <LanguageSwitch />
        </div>
        <label className="block">
          <span className="text-sm">{t('auth.email')}</span>
          <input type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm">{t('auth.password')}</span>
          <input type="password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        {failed && <p className="text-sm text-red-700">{t('auth.failed')}</p>}
        <button disabled={busy} className="w-full rounded bg-blue-700 py-2 text-white disabled:opacity-50">
          {t('auth.signIn')}
        </button>
      </form>
    </div>
  );
}
