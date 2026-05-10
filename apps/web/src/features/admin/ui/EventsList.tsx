import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  Eye,
  Inbox,
  Pencil,
  Trash2,
} from 'lucide-react';
import { slugSchema, type Event } from '@fastkudos/shared';
import type { OwnedEventsGateway } from '../domain/ports';

export interface EventsListProps {
  token: string;
  gateway: OwnedEventsGateway;
}

const INPUT_CLASS =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

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

  if (error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    );
  }

  if (!items) {
    return (
      <ul
        aria-label="Carregando eventos"
        className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-kudo"
      >
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <span className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <span className="block h-4 w-32 animate-pulse rounded bg-slate-100" />
              <span className="block h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-kudo">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
          <Inbox className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-900">
          Nenhum evento criado ainda.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Use o formulário acima para criar seu primeiro mural de kudos.
        </p>
        <a
          href="#novo-evento"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-rose-600"
        >
          Criar agora
        </a>
      </div>
    );
  }

  return (
    <ul
      data-testid="admin-events"
      className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-kudo"
    >
      {items.map((e) =>
        editingId === e.id ? (
          <li key={e.id} className="px-4 py-4 sm:px-5">
            <EditEventRow
              initial={{ name: e.name, slug: e.slug }}
              onCancel={() => setEditingId(null)}
              onSave={(patch) => handleSave(e.id, patch)}
            />
          </li>
        ) : (
          <li
            key={e.id}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/60 sm:px-5"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
              <a
                href={`/e/${e.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir página pública do evento"
                className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
              >
                /e/{e.slug}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                to={`/e/${e.slug}/moderate`}
                aria-label="Moderar"
                title="Moderar evento"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setEditingId(e.id)}
                aria-label="Editar"
                title="Editar evento"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(e.id, e.name)}
                aria-label="Apagar"
                title="Apagar evento"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
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
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Editar evento">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Nome</span>
        <input
          aria-label="Nome do evento"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          required
          className={INPUT_CLASS}
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Slug</span>
        <input
          aria-label="Slug"
          value={slug}
          onChange={(ev) => setSlug(ev.target.value)}
          required
          className={`${INPUT_CLASS} font-mono`}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-rose-600 disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-2 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </form>
  );
}
