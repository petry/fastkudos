import { useEffect, useMemo, useState } from 'react';
import type { Profile } from '@fastkudos/shared';
import { filterParticipants } from '../domain/filter';
import type { ParticipantsGateway } from '../domain/ports';

export interface ParticipantsListProps {
  slug: string;
  token: string;
  currentProfileId: string;
  gateway: ParticipantsGateway;
}

export function ParticipantsList({ slug, token, currentProfileId, gateway }: ParticipantsListProps) {
  const [items, setItems] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    gateway
      .list({ slug, token })
      .then((profiles) => {
        if (!cancelled) setItems(profiles);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [slug, token, gateway]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return filterParticipants(
      items.filter((p) => p.id !== currentProfileId),
      query,
    );
  }, [items, query, currentProfileId]);

  if (error) return <p role="alert" className="text-red-600">{error}</p>;
  if (!items) return <p>Carregando…</p>;

  return (
    <section className="mt-6">
      <input
        aria-label="Buscar participante"
        placeholder="Buscar…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2"
      />
      <ul className="mt-3 divide-y divide-slate-200" data-testid="participants">
        {filtered.map((p) => (
          <li key={p.id} className="py-2">{p.displayName}</li>
        ))}
        {filtered.length === 0 && <li className="py-2 text-slate-500">Nenhum participante.</li>}
      </ul>
    </section>
  );
}
