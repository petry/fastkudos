import { useMemo, useState } from 'react';
import { CheckCircle2, Send, Users as UsersIcon } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import { filterParticipants } from '../domain/filter';
import { SendKudoForm } from '../../kudos/ui/SendKudoForm';
import type { KudosGateway } from '../../kudos/domain/ports';
import { Avatar } from '../../../components/ui/Avatar';

export interface ParticipantsListProps {
  token: string;
  currentProfileId: string;
  profiles: Profile[];
  kudos: KudosGateway;
}

export function ParticipantsList({
  token,
  currentProfileId,
  profiles,
  kudos,
}: ParticipantsListProps) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filterParticipants(
        profiles.filter((p) => p.id !== currentProfileId),
        query,
      ),
    [profiles, query, currentProfileId],
  );

  return (
    <div>
      <input
        aria-label="Buscar participante"
        placeholder="Buscar participante…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
      {filtered.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
          <UsersIcon className="h-4 w-4" aria-hidden="true" />
          Nenhum participante.
        </p>
      ) : (
        <ul className="mt-3 space-y-3" data-testid="participants">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.displayName} imageUrl={p.avatarUrl} size="md" />
                <span
                  className="flex-1 truncate text-sm font-medium text-slate-800"
                  title={p.displayName}
                >
                  {p.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Enviar kudo
                </button>
              </div>
              {openId === p.id && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
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
        </ul>
      )}
      {sentTo && (
        <p
          role="status"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Kudo enviado para {sentTo}!
        </p>
      )}
    </div>
  );
}
