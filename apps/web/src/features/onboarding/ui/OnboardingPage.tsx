import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, LogOut, MessageCircle, Sparkles, Users } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import { joinEvent } from '../application/join-event';
import type { AuthGateway, SessionStore } from '../domain/ports';
import { ParticipantsList } from '../../participants/ui/ParticipantsList';
import type { EventSummary, ParticipantsGateway } from '../../participants/domain/ports';
import type { KudosGateway } from '../../kudos/domain/ports';
import { MuralFeed } from '../../mural/ui/MuralFeed';
import type { EventStream, MuralGateway } from '../../mural/domain/ports';
import { useKudoToasts } from '../../mural/ui/useKudoToasts';
import { Avatar } from '../../../components/ui/Avatar';
import { SectionHeader } from '../../../components/ui/SectionHeader';

export interface OnboardingPageProps {
  auth: AuthGateway;
  session: SessionStore;
  participants: ParticipantsGateway;
  kudos: KudosGateway;
  stream: EventStream;
  mural: MuralGateway;
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
    return (
      <JoinedView
        slug={slug}
        joined={joined}
        onLeave={() => {
          props.session.save?.(slug, null as unknown as { token: string; profile: Profile });
          setJoined(null);
        }}
        {...props}
      />
    );
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
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            FastKudos
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Entrar no evento</h1>
          <p className="mt-2 text-sm text-slate-600">
            Diga seu nome e comece a trocar reconhecimentos com a turma.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-kudo"
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Seu nome</span>
            <input
              aria-label="Seu nome"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como devemos te chamar?"
              required
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-sm hover:from-sky-600 hover:to-rose-600 disabled:opacity-50"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

function JoinedView({
  slug,
  joined,
  participants,
  kudos,
  stream,
  mural,
  notify,
  onLeave,
}: {
  slug: string;
  joined: { token: string; profile: Profile };
  onLeave: () => void;
} & OnboardingPageProps) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    participants
      .list({ slug, token: joined.token })
      .then((data) => {
        if (cancelled) return;
        setProfiles(data.profiles);
        setEvent(data.event);
      })
      .catch((e) => {
        if (!cancelled) setProfilesError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [slug, joined.token, participants]);

  useKudoToasts({
    slug,
    token: joined.token,
    myProfileId: joined.profile.id,
    stream,
    notify: notify ?? ((m) => toast.success(m)),
  });

  const profilesById = useMemo(() => {
    const map = new Map<string, Profile>();
    if (profiles) for (const p of profiles) map.set(p.id, p);
    map.set(joined.profile.id, joined.profile);
    return map;
  }, [profiles, joined.profile]);

  const otherCount = profiles
    ? profiles.filter((p) => p.id !== joined.profile.id).length
    : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-sky-500 via-sky-400 to-rose-400 px-6 pb-10 pt-8 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Avatar name={joined.profile.displayName} size="lg" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-white/70">Evento</p>
            <p
              data-testid="event-name"
              className="text-sm font-medium text-white/90"
            >
              {event?.name ?? '…'}
            </p>
            <p data-testid="welcome" className="mt-1 text-xl font-semibold">
              Olá, {joined.profile.displayName}!
            </p>
          </div>
          <Link
            to={`/e/${slug}/inbox`}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Caixa de recados
          </Link>
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <section>
          <SectionHeader title="Participantes" icon={Users} count={otherCount} />
          <div className="mt-3">
            {profilesError ? (
              <p role="alert" className="text-red-600">
                {profilesError}
              </p>
            ) : !profiles ? (
              <p className="text-slate-500">Carregando…</p>
            ) : (
              <ParticipantsList
                token={joined.token}
                currentProfileId={joined.profile.id}
                profiles={profiles}
                kudos={kudos}
              />
            )}
          </div>
        </section>

        <section>
          <SectionHeader title="Mural do evento" icon={Sparkles} />
          <div className="mt-3">
            <MuralFeed
              slug={slug}
              token={joined.token}
              stream={stream}
              gateway={mural}
              profilesById={profilesById}
              currentProfileId={joined.profile.id}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
