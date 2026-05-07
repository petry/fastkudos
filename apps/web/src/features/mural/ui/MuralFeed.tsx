import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Feedback, Profile } from '@fastkudos/shared';
import type { EventStream } from '../domain/ports';
import { applyMuralEvent } from '../domain/reduce';
import { KudoCard } from '../../../components/ui/KudoCard';

export interface MuralFeedProps {
  slug: string;
  token: string;
  stream: EventStream;
  profilesById: Map<string, Profile>;
  currentProfileId?: string;
}

export function MuralFeed({ slug, token, stream, profilesById, currentProfileId }: MuralFeedProps) {
  const [items, setItems] = useState<Feedback[]>([]);

  useEffect(() => {
    const unsubscribe = stream.subscribe({ slug, token }, (e) => {
      setItems((prev) => applyMuralEvent(prev, e));
    });
    return unsubscribe;
  }, [slug, token, stream]);

  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-rose-400" aria-hidden="true" />
        <p className="mt-2 text-sm text-slate-500">Aguardando o primeiro kudo do evento…</p>
      </div>
    );

  return (
    <ul className="space-y-3" data-testid="mural">
      {items.map((f) => (
        <KudoCard
          key={f.id}
          variant="mural"
          feedback={f}
          profilesById={profilesById}
          currentProfileId={currentProfileId}
        />
      ))}
    </ul>
  );
}
