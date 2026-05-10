import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import { joinEvent, joinEventAsUser } from '../application/join-event';
import { signOutFromEvent } from '../application/sign-out';
import type { AuthGateway, SessionStore } from '../domain/ports';
import type { LoggedSessionStore, UserAuthGateway } from '../../admin/domain/ports';
import { ParticipantsList } from '../../participants/ui/ParticipantsList';
import type { EventSummary, ParticipantsGateway } from '../../participants/domain/ports';
import type { KudosGateway } from '../../kudos/domain/ports';
import { MuralFeed } from '../../mural/ui/MuralFeed';
import type { EventStream, MuralGateway } from '../../mural/domain/ports';
import { useKudoToasts } from '../../mural/ui/useKudoToasts';
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection';
import { EventShell } from './EventShell';

export interface OnboardingPageProps {
  auth: AuthGateway;
  session: SessionStore;
  /** Sessão de user logado (Google). Quando presente, dispara auto-join silencioso. */
  userSession?: LoggedSessionStore;
  /** Gateway para iniciar login social no formulário de entrada. */
  userAuth?: UserAuthGateway;
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
  const navigate = useNavigate();
  const [joined, setJoined] = useState<{ token: string; profile: Profile } | null>(
    () => props.session.load(slug),
  );
  const [logged] = useState(() => (joined ? null : props.userSession?.load() ?? null));
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (joined || !logged) return;
    let cancelled = false;
    joinEventAsUser(
      { auth: props.auth, session: props.session },
      { slug, userToken: logged.token },
    )
      .then((s) => {
        if (cancelled) return;
        setJoined(s);
        props.onJoined?.(s);
      })
      .catch((e) => {
        if (cancelled) return;
        setAutoJoinError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [joined, logged, slug, props.auth, props.session, props.onJoined]);

  if (joined) {
    return (
      <JoinedView
        slug={slug}
        joined={joined}
        onLeave={() => {
          signOutFromEvent({ session: props.session, userSession: props.userSession }, slug);
          navigate('/');
        }}
        {...props}
      />
    );
  }
  if (logged) {
    return <AutoJoiningView name={logged.user.name} error={autoJoinError} />;
  }
  return (
    <JoinForm
      slug={slug}
      auth={props.auth}
      session={props.session}
      userAuth={props.userAuth}
      onJoined={(s) => {
        setJoined(s);
        props.onJoined?.(s);
      }}
    />
  );
}

function AutoJoiningView({ name, error }: { name: string; error: string | null }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-rose-50 px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          FastKudos
        </span>
        {error ? (
          <>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Não foi possível entrar</h1>
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
            <Link to="/dashboard" className="mt-6 inline-block text-sm text-sky-700 underline">
              Voltar para o dashboard
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Entrando como {name}…</h1>
            <p className="mt-2 text-sm text-slate-600">Só um instante.</p>
          </>
        )}
      </div>
    </main>
  );
}

interface JoinFormProps {
  slug: string;
  auth: AuthGateway;
  session: SessionStore;
  userAuth?: UserAuthGateway;
  onJoined: (s: { token: string; profile: Profile }) => void;
}

function JoinForm({ slug, auth, session, userAuth, onJoined }: JoinFormProps) {
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
        {userAuth && (
          <>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
              ou
              <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={() => userAuth.startGoogleLogin(`/e/${slug}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Continuar com Google
            </button>
          </>
        )}
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
  userSession,
}: {
  slug: string;
  joined: { token: string; profile: Profile };
  onLeave: () => void;
} & OnboardingPageProps) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [loggedIn] = useState(() => !!userSession?.load());

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
    <EventShell
      slug={slug}
      profile={joined.profile}
      event={event}
      onSignOut={onLeave}
      loggedIn={loggedIn}
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <CollapsibleSection title="Participantes" icon={Users} count={otherCount} defaultExpanded={false}>
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
        </CollapsibleSection>

        <CollapsibleSection title="Mural do evento" icon={Sparkles}>
          <MuralFeed
            slug={slug}
            token={joined.token}
            stream={stream}
            gateway={mural}
            profilesById={profilesById}
            currentProfileId={joined.profile.id}
          />
        </CollapsibleSection>
      </div>
    </EventShell>
  );
}
