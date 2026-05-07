import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '@fastkudos/shared';
import type { AdminEventsGateway } from '../domain/ports';

export interface EventsListProps {
  token: string;
  gateway: AdminEventsGateway;
}

export function EventsList({ token, gateway }: EventsListProps) {
  const [items, setItems] = useState<Event[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <p role="alert" className="text-red-600">{error}</p>;
  if (!items) return <p>Carregando eventos…</p>;
  if (items.length === 0) return <p className="text-slate-500">Nenhum evento criado ainda.</p>;

  return (
    <ul className="divide-y divide-slate-200" data-testid="admin-events">
      {items.map((e) => (
        <li key={e.id} className="flex items-center justify-between py-2">
          <span>
            {e.name} <code className="text-xs text-slate-500">/e/{e.slug}</code>
          </span>
          <Link
            to={`/admin/events/${e.id}`}
            className="text-sm text-sky-700 underline"
          >
            Moderar
          </Link>
        </li>
      ))}
    </ul>
  );
}
