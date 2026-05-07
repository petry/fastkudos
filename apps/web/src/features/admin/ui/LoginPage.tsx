import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { UserAuthGateway } from '../domain/ports';

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

export function LoginPage({ auth, defaultRedirect = '/dashboard' }: LoginPageProps) {
  const [params] = useSearchParams();
  const errorParam = params.get('error');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) setErrorMsg(ERROR_LABELS[errorParam] ?? 'Erro desconhecido.');
  }, [errorParam]);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="mt-2 text-sm text-slate-600">
        Faça login para criar e gerenciar seus eventos. Para apenas participar de um evento, abra o link
        recebido (<code>/e/&lt;slug&gt;</code>).
      </p>

      <button
        type="button"
        onClick={() => auth.startGoogleLogin(defaultRedirect)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
      >
        Continuar com Google
      </button>

      <button
        type="button"
        disabled
        className="mt-2 w-full cursor-not-allowed rounded border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400"
      >
        Continuar com GitHub (em breve)
      </button>
      <button
        type="button"
        disabled
        className="mt-2 w-full cursor-not-allowed rounded border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400"
      >
        Continuar com LinkedIn (em breve)
      </button>

      {errorMsg && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {errorMsg}
        </p>
      )}
    </main>
  );
}
