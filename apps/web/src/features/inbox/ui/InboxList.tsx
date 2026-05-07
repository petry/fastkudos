import { useEffect, useState } from 'react';
import type { Feedback } from '@fastkudos/shared';
import type { InboxGateway } from '../domain/ports';

export interface InboxListProps {
  token: string;
  gateway: InboxGateway;
}

export function InboxList({ token, gateway }: InboxListProps) {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateway
      .list({ token })
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [token, gateway]);

  if (error) return <p role="alert" className="text-red-600">{error}</p>;
  if (!items) return <p>Carregando caixa de recados…</p>;
  if (items.length === 0)
    return <p className="text-slate-500">Sua caixa está vazia. Envie kudos para receber!</p>;

  return (
    <ul className="space-y-2" data-testid="inbox">
      {items.map((f) => (
        <li key={f.id} className="rounded border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm">{f.content}</p>
          <time className="text-xs text-slate-500">{new Date(f.createdAt).toLocaleString()}</time>
        </li>
      ))}
    </ul>
  );
}
