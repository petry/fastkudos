import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoggedSessionStore, UserAuthGateway } from '../domain/ports';

export interface AuthCallbackPageProps {
  session: LoggedSessionStore;
  auth: UserAuthGateway;
}

function parseHashParams(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
}

function safeRedirect(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

export function AuthCallbackPage({ session, auth }: AuthCallbackPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = parseHashParams(window.location.hash);
    const token = params.get('token');
    const redirect = safeRedirect(params.get('redirect'));

    if (!token) {
      setError('Token ausente na resposta do login.');
      return;
    }

    let cancelled = false;
    auth
      .fetchMe(token)
      .then((user) => {
        if (cancelled) return;
        session.save({ token, user });
        // Limpa o fragmento da URL antes de redirecionar.
        window.history.replaceState({}, '', window.location.pathname);
        navigate(redirect, { replace: true });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'erro');
      });

    return () => {
      cancelled = true;
    };
  }, [auth, session, navigate]);

  if (error) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-slate-600">Concluindo login…</p>
    </main>
  );
}
