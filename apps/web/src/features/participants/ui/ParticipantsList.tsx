import { useEffect, useMemo, useState } from 'react';
import type { Profile } from '@fastkudos/shared';
import { filterParticipants } from '../domain/filter';
import type { ParticipantsGateway } from '../domain/ports';
import { SendKudoForm } from '../../kudos/ui/SendKudoForm';
import type { KudosGateway } from '../../kudos/domain/ports';

export interface ParticipantsListProps {
  slug: string;
  token: string;
  currentProfileId: string;
  gateway: ParticipantsGateway;
  kudos: KudosGateway;
}

export function ParticipantsList({ slug, token, currentProfileId, gateway, kudos }: ParticipantsListProps) {
  const [items, setItems] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

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
          <li key={p.id} className="py-2">
            <div className="flex items-center justify-between">
              <span>{p.displayName}</span>
              <button
                type="button"
                onClick={() => setOpenId(openId === p.id ? null : p.id)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                Enviar kudo
              </button>
            </div>
            {openId === p.id && (
              <div className="mt-2">
                <SendKudoForm
                  receiver={p}
                  token={token}
                  gateway={kudos}
                  onSent={() => {
                    setOpenId(null);
                    setSentTo(p.displayName);
                  }}
                  onCancel={() => setOpenId(null)}
                />
              </div>
            )}
          </li>
        ))}
        {filtered.length === 0 && <li className="py-2 text-slate-500">Nenhum participante.</li>}
      </ul>
      {sentTo && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          Kudo enviado para {sentTo}!
        </p>
      )}
    </section>
  );
}
