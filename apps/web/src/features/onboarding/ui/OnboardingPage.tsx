import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Profile } from '@fastkudos/shared';
import { joinEvent } from '../application/join-event';
import type { AuthGateway, SessionStore } from '../domain/ports';

export interface OnboardingPageProps {
  auth: AuthGateway;
  session: SessionStore;
  onJoined?: (s: { token: string; profile: Profile }) => void;
}

export function OnboardingPage({ auth, session, onJoined }: OnboardingPageProps) {
  const { slug = '' } = useParams();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState<{ token: string; profile: Profile } | null>(
    () => session.load(slug),
  );

  if (joined) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p data-testid="welcome">Olá, {joined.profile.displayName}!</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const s = await joinEvent({ auth, session }, { slug, displayName });
      setJoined(s);
      onJoined?.(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Entrar no evento</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm text-slate-600">Seu nome</span>
          <input
            aria-label="Seu nome"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
