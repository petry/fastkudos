import { MessageCircle } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import type { InboxGateway } from '../domain/ports';
import { KudoCard } from '../../../components/ui/KudoCard';
import { useAsyncData } from '../../../lib/use-async-data';

export interface InboxListProps {
  token: string;
  gateway: InboxGateway;
  profilesById: Map<string, Profile>;
}

export function InboxList({ token, gateway, profilesById }: InboxListProps) {
  const { data: items, error } = useAsyncData(() => gateway.list({ token }), [token, gateway]);

  if (error)
    return (
      <p role="alert" className="text-red-600">
        {error}
      </p>
    );
  if (!items) return <p className="text-slate-500">Carregando caixa de recados…</p>;
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center">
        <MessageCircle className="mx-auto h-8 w-8 text-sky-400" aria-hidden="true" />
        <p className="mt-2 text-sm text-slate-500">
          Sua caixa está vazia. Envie kudos para começar a receber!
        </p>
      </div>
    );

  return (
    <ul className="space-y-3" data-testid="inbox">
      {items.map((f) => (
        <KudoCard key={f.id} variant="inbox" feedback={f} profilesById={profilesById} />
      ))}
    </ul>
  );
}
