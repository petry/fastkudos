import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import type { SessionStore } from '../../onboarding/domain/ports';
import type { LoggedSessionStore } from '../../admin/domain/ports';
import { signOutFromEvent } from '../../onboarding/application/sign-out';
import type { EventSummary, ParticipantsGateway } from '../../participants/domain/ports';
import type { InboxGateway } from '../domain/ports';
import { InboxList } from './InboxList';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { EventShell } from '../../onboarding/ui/EventShell';

export interface InboxPageProps {
  session: SessionStore;
  userSession?: LoggedSessionStore;
  participants: ParticipantsGateway;
  inbox: InboxGateway;
}

export function InboxPage({ session, userSession, participants, inbox }: InboxPageProps) {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [joined] = useState(() => session.load(slug));
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
    if (!joined) return;
    signOutFromEvent({ session, userSession }, slug);
    navigate('/');
  }

  return (
    <EventShell slug={slug} profile={joined.profile} event={event} onSignOut={handleLeave}>
      <div className="mx-auto max-w-2xl space-y-8">
        <section>
          <SectionHeader title="Sua caixa de recados" icon={MessageCircle} />
          <div className="mt-3">
            <InboxList token={joined.token} gateway={inbox} profilesById={profilesById} />
          </div>
        </section>
      </div>
    </EventShell>
  );
}
