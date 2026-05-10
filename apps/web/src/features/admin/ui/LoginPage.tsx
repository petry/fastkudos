import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import type { UserAuthGateway } from '../domain/ports';
import { AuthShell } from './AuthShell';
import { trackEvent } from '../../../lib/analytics';

export interface LoginPageProps {
  auth: UserAuthGateway;
  defaultRedirect?: string;
}

const ERROR_LABELS: Record<string, string> = {
  oauth_state: 'Sessão de login expirou. Tente de novo.',
  unverified_email: 'Sua conta Google não tem o email verificado.',
  invalid_id_token: 'Resposta do Google inválida. Tente de novo.',
  oauth_failed: 'Falha ao concluir login. Tente de novo.',
};

const PROVIDER_BUTTON_CLASS =
  'flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white';

export function LoginPage({ auth, defaultRedirect = '/dashboard' }: LoginPageProps) {
  const [params] = useSearchParams();
  const errorParam = params.get('error');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) {
      setErrorMsg(ERROR_LABELS[errorParam] ?? 'Erro desconhecido.');
      trackEvent('auth_error', { error_code: errorParam });
    }
  }, [errorParam]);

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Entrar no FastKudos
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Bem-vindo! Faça login para criar seus próprios eventos de kudos.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Se você foi convidado para um, é só abrir o link que recebeu.
      </p>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={() => {
            trackEvent('admin_login_start', { provider: 'google' });
            auth.startGoogleLogin(defaultRedirect);
          }}
          className={PROVIDER_BUTTON_CLASS}
        >
          <GoogleIcon />
          Continuar com Google
        </button>
        <button type="button" disabled className={PROVIDER_BUTTON_CLASS}>
          <span className="text-base">G</span>
          Continuar com GitHub <span className="text-xs text-slate-400">(em breve)</span>
        </button>
        <button type="button" disabled className={PROVIDER_BUTTON_CLASS}>
          <span className="text-base">in</span>
          Continuar com LinkedIn <span className="text-xs text-slate-400">(em breve)</span>
        </button>
      </div>

      {errorMsg && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </p>
      )}

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Voltar para a home
      </Link>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.92v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.92A9 9 0 0 0 0 9c0 1.45.35 2.83.92 4.05l3.05-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .92 4.95l3.05 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
