import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Feedback, Profile } from '@fastkudos/shared';
import type { EventStream, MuralGateway } from '../domain/ports';
import { applyMuralEvent } from '../domain/reduce';
import { KudoCard } from '../../../components/ui/KudoCard';
import { trackEvent } from '../../../lib/analytics';

export interface MuralFeedProps {
  slug: string;
  token: string;
  stream: EventStream;
  gateway: MuralGateway;
  profilesById: Map<string, Profile>;
  currentProfileId?: string;
}

export function MuralFeed({
  slug,
  token,
  stream,
  gateway,
  profilesById,
  currentProfileId,
}: MuralFeedProps) {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('mural_open', { event_slug: slug });
    let cancelled = false;
    const unsubscribe = stream.subscribe({ slug, token }, (e) => {
      if (e.type === 'kudo.created') {
        trackEvent('kudo_realtime_received', { event_slug: slug });
      }
      setItems((prev) => applyMuralEvent(prev ?? [], e));
    });
    gateway
      .list({ token })
      .then((loaded) => {
        if (cancelled) return;
        setItems((prev) =>
          loaded.reduce(
            (acc, feedback) => applyMuralEvent(acc, { type: 'kudo.created', feedback }),
            prev ?? [],
          ),
        );
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [slug, token, stream, gateway]);

  if (error)
    return (
      <p role="alert" className="text-red-600">
        {error}
      </p>
    );

  if (items === null) return <p className="text-slate-500">Carregando mural…</p>;

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
