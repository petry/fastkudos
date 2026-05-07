import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { Feedback } from '@fastkudos/shared';
import type { AdminEventsGateway, AdminSessionStore } from '../domain/ports';

export interface ModerationPageProps {
  session: AdminSessionStore;
  gateway: AdminEventsGateway;
}

export function ModerationPage({ session, gateway }: ModerationPageProps) {
  // Carrega a sessão uma única vez. Repetir session.load() a cada render geraria
  // novas referências e re-disparava o useEffect, recarregando a lista após delete.
  const [current] = useState(() => session.load());
  const { id = '' } = useParams();
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    gateway
      .feedbacks({ token: current.token, eventId: id })
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [current, gateway, id]);

  if (!current) return <Navigate to="/admin/login" replace />;

  async function handleDelete(feedbackId: string) {
    setBusyId(feedbackId);
    try {
      await gateway.deleteFeedback({ token: current!.token, feedbackId });
      setItems((prev) => (prev ? prev.filter((f) => f.id !== feedbackId) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <Link to="/admin" className="text-sm text-slate-600 underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Moderação</h1>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {!items && !error && <p className="mt-4">Carregando…</p>}
      {items && items.length === 0 && (
        <p className="mt-4 text-slate-500">Nenhum feedback ainda.</p>
      )}
      {items && items.length > 0 && (
        <ul className="mt-4 space-y-2" data-testid="moderation-feedbacks">
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
      )}
    </main>
  );
}
