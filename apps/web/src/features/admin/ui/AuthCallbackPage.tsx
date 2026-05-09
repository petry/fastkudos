import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { LoggedSessionStore, UserAuthGateway } from '../domain/ports';
import { AuthShell } from './AuthShell';

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
      <AuthShell>
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar ao login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" aria-hidden="true" />
        <p className="text-sm text-slate-600">Concluindo login…</p>
      </div>
    </AuthShell>
  );
}
