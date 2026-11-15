import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { supabase } from './supabase';

/** undefined while loading, null when signed out. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

/** Shows its children only to signed-in NEO admins. The database enforces the same rule. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!session) return;
    void supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true));
  }, [session]);

  if (session === null) return <Navigate to="/admin/login" replace />;
  if (session === undefined || isAdmin === undefined) return <p className="p-8 text-gray-500">{t('common.loading')}</p>;
  if (!isAdmin) {
    return (
      <div className="p-8">
        <p>{t('auth.notAdmin')}</p>
        <button className="mt-4 underline" onClick={() => void supabase.auth.signOut()}>
          {t('auth.signOut')}
        </button>
      </div>
    );
  }
  return children;
}
