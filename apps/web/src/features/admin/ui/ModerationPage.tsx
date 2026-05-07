import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { Feedback, Profile } from '@fastkudos/shared';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';

export interface ModerationPageProps {
  session: LoggedSessionStore;
  gateway: OwnedEventsGateway;
}

export function ModerationPage({ session, gateway }: ModerationPageProps) {
  // Carrega a sessão uma única vez. Repetir session.load() a cada render geraria
  // novas referências e re-disparava os useEffect, recarregando após delete.
  const [current] = useState(() => session.load());
  const { id = '' } = useParams();

  if (!current) return <Navigate to="/login" replace />;

  return (
    <main className="mx-auto max-w-md p-6">
      <Link to="/dashboard" className="text-sm text-slate-600 underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Moderação</h1>

      <section className="mt-4">
        <h2 className="text-lg font-semibold">Feedbacks</h2>
        <FeedbacksSection token={current.token} eventId={id} gateway={gateway} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Participantes</h2>
        <ProfilesSection token={current.token} eventId={id} gateway={gateway} />
      </section>
    </main>
  );
}

function FeedbacksSection({
  token,
  eventId,
  gateway,
}: {
  token: string;
  eventId: string;
  gateway: OwnedEventsGateway;
}) {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateway
      .feedbacks({ token, eventId })
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [token, eventId, gateway]);

  async function handleDelete(feedbackId: string) {
    setBusyId(feedbackId);
    try {
      await gateway.deleteFeedback({ token, feedbackId });
      setItems((prev) => (prev ? prev.filter((f) => f.id !== feedbackId) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!items) return <p>Carregando…</p>;
  if (items.length === 0) return <p className="text-slate-500">Nenhum feedback ainda.</p>;

  return (
    <ul className="space-y-2" data-testid="moderation-feedbacks">
      {items.map((f) => (
        <li key={f.id} className="rounded border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm">{f.content}</p>
          <div className="mt-2 flex items-center justify-between">
            <time className="text-xs text-slate-500">
              {new Date(f.createdAt).toLocaleString()}
            </time>
            <button
              type="button"
              disabled={busyId === f.id}
              onClick={() => handleDelete(f.id)}
              className="text-xs text-red-600 underline disabled:opacity-50"
            >
              Apagar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProfilesSection({
  token,
  eventId,
  gateway,
}: {
  token: string;
  eventId: string;
  gateway: OwnedEventsGateway;
}) {
  const [items, setItems] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateway
      .profiles({ token, eventId })
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [token, eventId, gateway]);

  async function handleDelete(profileId: string) {
    setBusyId(profileId);
    try {
      await gateway.deleteProfile({ token, profileId });
      setItems((prev) => (prev ? prev.filter((p) => p.id !== profileId) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!items) return <p>Carregando…</p>;
  if (items.length === 0) return <p className="text-slate-500">Sem participantes.</p>;

  return (
    <ul className="divide-y divide-slate-200" data-testid="moderation-profiles">
      {items.map((p) => (
        <li key={p.id} className="flex items-center justify-between py-2">
          <span>{p.displayName}</span>
          <button
            type="button"
            disabled={busyId === p.id}
            onClick={() => handleDelete(p.id)}
            className="text-xs text-red-600 underline disabled:opacity-50"
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  );
}
