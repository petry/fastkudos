import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Profile } from '@fastkudos/shared';
import { joinEvent } from '../application/join-event';
import type { AuthGateway, SessionStore } from '../domain/ports';
import { ParticipantsList } from '../../participants/ui/ParticipantsList';
import type { ParticipantsGateway } from '../../participants/domain/ports';
import type { KudosGateway } from '../../kudos/domain/ports';
import { InboxList } from '../../inbox/ui/InboxList';
import type { InboxGateway } from '../../inbox/domain/ports';
import { MuralFeed } from '../../mural/ui/MuralFeed';
import type { EventStream } from '../../mural/domain/ports';
import { useKudoToasts } from '../../mural/ui/useKudoToasts';

export interface OnboardingPageProps {
  auth: AuthGateway;
  session: SessionStore;
  participants: ParticipantsGateway;
  kudos: KudosGateway;
  inbox: InboxGateway;
  stream: EventStream;
  onJoined?: (s: { token: string; profile: Profile }) => void;
  /** Injetável para testes; padrão usa sonner. */
  notify?: (message: string) => void;
}

export function OnboardingPage(props: OnboardingPageProps) {
  const { slug = '' } = useParams();
  const [joined, setJoined] = useState<{ token: string; profile: Profile } | null>(
    () => props.session.load(slug),
  );

  if (joined) {
    return <JoinedView slug={slug} joined={joined} {...props} />;
  }
  return (
    <JoinForm
      slug={slug}
      auth={props.auth}
      session={props.session}
      onJoined={(s) => {
        setJoined(s);
        props.onJoined?.(s);
      }}
    />
  );
}

interface JoinFormProps {
  slug: string;
  auth: AuthGateway;
  session: SessionStore;
  onJoined: (s: { token: string; profile: Profile }) => void;
}

function JoinForm({ slug, auth, session, onJoined }: JoinFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const s = await joinEvent({ auth, session }, { slug, displayName });
      onJoined(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Entrar no evento</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm text-slate-600">Seu nome</span>
          <input
            aria-label="Seu nome"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}

function JoinedView({
  slug,
  joined,
  participants,
  kudos,
  inbox,
  stream,
  notify,
}: { slug: string; joined: { token: string; profile: Profile } } & OnboardingPageProps) {
  useKudoToasts({
    slug,
    token: joined.token,
    myProfileId: joined.profile.id,
    stream,
    notify: notify ?? ((m) => toast.success(m)),
  });

  return (
    <main className="mx-auto max-w-md p-6">
      <p data-testid="welcome">Olá, {joined.profile.displayName}!</p>
      <ParticipantsList
        slug={slug}
        token={joined.token}
        currentProfileId={joined.profile.id}
        gateway={participants}
        kudos={kudos}
      />
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Caixa de recados</h2>
        <div className="mt-2">
          <InboxList token={joined.token} gateway={inbox} />
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Mural</h2>
        <div className="mt-2">
          <MuralFeed slug={slug} token={joined.token} stream={stream} />
        </div>
      </section>
    </main>
  );
}
