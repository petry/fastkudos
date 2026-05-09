import { useState } from 'react';
import { AlertCircle, CalendarDays, Check, Copy, Plus } from 'lucide-react';
import { slugSchema } from '@fastkudos/shared';
import type { OwnedEventsGateway } from '../domain/ports';
import { SectionHeader } from '../../../components/ui/SectionHeader';

export interface CreateEventFormProps {
  token: string;
  gateway: OwnedEventsGateway;
  onCreated?: (event: { id: string; slug: string; name: string }) => void;
}

const INPUT_CLASS =
  'mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

export function CreateEventForm({ token, gateway, onCreated }: CreateEventFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setCopied(false);
      onCreated?.(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop — fallback silencioso
    }
  }

  const createdUrl = created ? `${window.location.origin}/e/${created.slug}` : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-kudo">
      <SectionHeader title="Criar evento" icon={CalendarDays} />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Criar evento">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nome do evento</span>
          <input
            aria-label="Nome do evento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Offsite Tech 2026"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <input
            aria-label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className={`${INPUT_CLASS} font-mono`}
            placeholder="offsite-tech-2026"
          />
          <span className="mt-1.5 block text-xs text-slate-500">
            Compõe o link público: <code>/e/{slug || 'seu-slug'}</code>
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-rose-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {submitting ? 'Criando…' : 'Criar'}
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {created && createdUrl && (
          <div
            role="status"
            className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <p>
              <span className="font-medium">Evento criado:</span>{' '}
              <a
                href={createdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-mono underline hover:text-emerald-900"
              >
                {createdUrl}
              </a>
            </p>
            <button
              type="button"
              onClick={() => handleCopy(createdUrl)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar link
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
