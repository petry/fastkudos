import { useEffect, useState } from 'react';
import type { Feedback } from '@fastkudos/shared';
import type { EventStream } from '../domain/ports';
import { applyMuralEvent } from '../domain/reduce';

export interface MuralFeedProps {
  slug: string;
  token: string;
  stream: EventStream;
}

export function MuralFeed({ slug, token, stream }: MuralFeedProps) {
  const [items, setItems] = useState<Feedback[]>([]);

  useEffect(() => {
    const unsubscribe = stream.subscribe({ slug, token }, (e) => {
      setItems((prev) => applyMuralEvent(prev, e));
    });
    return unsubscribe;
  }, [slug, token, stream]);

  if (items.length === 0)
    return <p className="text-slate-500">Aguardando o primeiro kudo do evento…</p>;

  return (
    <ul className="space-y-2" data-testid="mural">
      {items.map((f) => (
        <li key={f.id} className="rounded border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm">{f.content}</p>
        </li>
      ))}
    </ul>
  );
}
