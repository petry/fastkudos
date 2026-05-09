import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LogOut, MessageCircle } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import type { SessionStore } from '../../onboarding/domain/ports';
import type { EventSummary, ParticipantsGateway } from '../../participants/domain/ports';
import type { InboxGateway } from '../domain/ports';
import { InboxList } from './InboxList';
import { Avatar } from '../../../components/ui/Avatar';
import { SectionHeader } from '../../../components/ui/SectionHeader';

export interface InboxPageProps {
  session: SessionStore;
  participants: ParticipantsGateway;
  inbox: InboxGateway;
}

export function InboxPage({ session, participants, inbox }: InboxPageProps) {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(() => session.load(slug));
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);

  useEffect(() => {
    if (!joined) navigate(`/e/${slug}`, { replace: true });
  }, [joined, navigate, slug]);

  useEffect(() => {
    if (!joined) return;
    let cancelled = false;
    participants
      .list({ slug, token: joined.token })
      .then((data) => {
        if (cancelled) return;
        setProfiles(data.profiles);
        setEvent(data.event);
      })
      .catch(() => {
        /* não-bloqueante: nomes caem para fallback no card */
      });
    return () => {
      cancelled = true;
    };
  }, [slug, joined, participants]);

  const profilesById = useMemo(() => {
    const map = new Map<string, Profile>();
    if (profiles) for (const p of profiles) map.set(p.id, p);
    if (joined) map.set(joined.profile.id, joined.profile);
    return map;
  }, [profiles, joined]);

  if (!joined) return null;

  function handleLeave() {
    session.save?.(slug, null as unknown as { token: string; profile: Profile });
    setJoined(null);
    navigate(`/e/${slug}`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-sky-500 via-sky-400 to-rose-400 px-6 pb-10 pt-8 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Avatar name={joined.profile.displayName} imageUrl={joined.profile.avatarUrl} size="lg" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-white/70">Evento</p>
            <p data-testid="event-name" className="text-sm font-medium text-white/90">
              {event?.name ?? '…'}
            </p>
            <p className="mt-1 text-xl font-semibold">Olá, {joined.profile.displayName}!</p>
          </div>
          <Link
            to={`/e/${slug}`}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar
          </Link>
          <button
            type="button"
            onClick={handleLeave}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <section>
          <SectionHeader title="Sua caixa de recados" icon={MessageCircle} />
          <div className="mt-3">
            <InboxList token={joined.token} gateway={inbox} profilesById={profilesById} />
          </div>
        </section>
      </div>
    </main>
  );
}
