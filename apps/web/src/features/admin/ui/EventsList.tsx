import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { slugSchema, type Event } from '@fastkudos/shared';
import type { OwnedEventsGateway } from '../domain/ports';

export interface EventsListProps {
  token: string;
  gateway: OwnedEventsGateway;
}

export function EventsList({ token, gateway }: EventsListProps) {
  const [items, setItems] = useState<Event[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateway
      .list({ token })
      .then((events) => {
        if (!cancelled) setItems(events);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [token, gateway]);

  async function handleDelete(eventId: string, name: string) {
    const confirmed = window.confirm(
      `Apagar o evento "${name}"? Todos os participantes e mensagens serão removidos. Esta ação é irreversível.`,
    );
    if (!confirmed) return;
    try {
      await gateway.delete({ token, eventId });
      setItems((prev) => (prev ? prev.filter((e) => e.id !== eventId) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function handleSave(eventId: string, patch: { name: string; slug: string }) {
    try {
      const updated = await gateway.update({ token, eventId, patch });
      setItems((prev) =>
        prev
          ? prev.map((e) => (e.id === eventId ? { ...e, name: updated.name, slug: updated.slug } : e))
          : prev,
      );
      setEditingId(null);
    } catch (e) {
      throw e instanceof Error ? e : new Error('erro');
    }
  }

  if (error) return <p role="alert" className="text-red-600">{error}</p>;
  if (!items) return <p>Carregando eventos…</p>;
  if (items.length === 0) return <p className="text-slate-500">Nenhum evento criado ainda.</p>;

  return (
    <ul className="divide-y divide-slate-200" data-testid="admin-events">
      {items.map((e) =>
        editingId === e.id ? (
          <li key={e.id} className="py-3">
            <EditEventRow
              initial={{ name: e.name, slug: e.slug }}
              onCancel={() => setEditingId(null)}
              onSave={(patch) => handleSave(e.id, patch)}
            />
          </li>
        ) : (
          <li key={e.id} className="flex items-center justify-between gap-2 py-2">
            <span className="min-w-0 truncate">
              {e.name} <code className="text-xs text-slate-500">/e/{e.slug}</code>
            </span>
            <span className="flex shrink-0 gap-3 text-sm">
              <Link to={`/dashboard/events/${e.id}`} className="text-sky-700 underline">
                Moderar
              </Link>
              <button
                type="button"
                onClick={() => setEditingId(e.id)}
                className="text-slate-700 underline"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(e.id, e.name)}
                className="text-red-600 underline"
              >
                Apagar
              </button>
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

function EditEventRow({
  initial,
  onSave,
  onCancel,
}: {
  initial: { name: string; slug: string };
  onSave: (patch: { name: string; slug: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const slugCheck = slugSchema.safeParse(slug);
    if (!slugCheck.success) {
      setError(slugCheck.error.issues[0]?.message ?? 'slug inválido');
      return;
    }
    setBusy(true);
    try {
      await onSave({ name, slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" aria-label="Editar evento">
      <label className="block">
        <span className="text-xs text-slate-600">Nome</span>
        <input
          aria-label="Nome do evento"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="text-xs text-slate-600">Slug</span>
        <input
          aria-label="Slug"
          value={slug}
          onChange={(ev) => setSlug(ev.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-sky-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
