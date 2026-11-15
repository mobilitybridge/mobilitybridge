import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import LanguageSwitch from '../../LanguageSwitch';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const { t } = useTranslation();
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded ${isActive ? 'bg-blue-50 font-semibold text-blue-800' : 'text-gray-700'}`;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex flex-wrap items-center gap-2 border-b bg-white px-6 py-3">
        <span className="me-4 font-semibold">{t('app.title')}</span>
        <NavLink to="/admin" end className={link}>{t('nav.directory')}</NavLink>
        <NavLink to="/admin/dashboard" className={link}>{t('nav.dashboard')}</NavLink>
        <NavLink to="/admin/import" className={link}>{t('nav.import')}</NavLink>
        <span className="ms-auto flex gap-2">
          <LanguageSwitch />
          <button className="rounded border px-3 py-1 text-sm" onClick={() => void supabase.auth.signOut()}>
            {t('auth.signOut')}
          </button>
        </span>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
