import { useState } from 'react';
import { slugSchema } from '@fastkudos/shared';
import type { AdminEventsGateway } from '../domain/ports';

export interface CreateEventFormProps {
  token: string;
  gateway: AdminEventsGateway;
  onCreated?: (event: { id: string; slug: string; name: string }) => void;
}

export function CreateEventForm({ token, gateway, onCreated }: CreateEventFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const slugCheck = slugSchema.safeParse(slug);
    if (!slugCheck.success) {
      setError(slugCheck.error.issues[0]?.message ?? 'slug inválido');
      return;
    }
    setSubmitting(true);
    try {
      const event = await gateway.create({ token, name, slug });
      setCreated(event);
      setName('');
      setSlug('');
      onCreated?.(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Criar evento">
      <label className="block">
        <span className="text-sm text-slate-600">Nome do evento</span>
        <input
          aria-label="Nome do evento"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-slate-600">Slug</span>
        <input
          aria-label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono"
          placeholder="offsite-tech-2026"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Criando…' : 'Criar'}
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {created && (
        <p role="status" className="text-sm text-emerald-700">
          Evento criado: <code>/e/{created.slug}</code>
        </p>
      )}
    </form>
  );
}
