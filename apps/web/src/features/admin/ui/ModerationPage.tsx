import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Inbox,
  MessageCircle,
  Trash2,
  Users,
} from 'lucide-react';
import type { Feedback, Profile } from '@fastkudos/shared';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';
import { AppShell } from './AppShell';
import { Avatar } from '../../../components/ui/Avatar';
import { KudoCard } from '../../../components/ui/KudoCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';

export interface ModerationPageProps {
  session: LoggedSessionStore;
  gateway: OwnedEventsGateway;
}

export function ModerationPage({ session, gateway }: ModerationPageProps) {
  // Carrega a sessão uma única vez. Repetir session.load() a cada render geraria
  // novas referências e re-disparava os useEffect, recarregando após delete.
  const [current] = useState(() => session.load());
  const { id = '' } = useParams();

  if (!current) return <Navigate to="/login" replace />;

  function handleSignOut() {
    session.clear();
    window.location.assign('/login');
  }

  return (
    <AppShell current={current.user} onSignOut={handleSignOut} width="3xl">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Voltar
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Moderação</h1>
      <p className="mt-1 text-sm text-slate-600">
        Modere feedbacks e participantes deste evento.
      </p>

      <section className="mt-8">
        <FeedbacksSection token={current.token} eventId={id} gateway={gateway} />
      </section>

      <section className="mt-10">
        <ProfilesSection token={current.token} eventId={id} gateway={gateway} />
      </section>
    </AppShell>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

function FeedbacksSection({
  token,
  eventId,
  gateway,
}: {
  token: string;
  eventId: string;
  gateway: OwnedEventsGateway;
}) {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      gateway.feedbacks({ token, eventId }),
      gateway.profiles({ token, eventId }),
    ])
      .then(([fbs, pfs]) => {
        if (cancelled) return;
        setItems(fbs);
        setProfiles(pfs);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [token, eventId, gateway]);

  const profilesById = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  async function handleDelete(feedbackId: string) {
    setBusyId(feedbackId);
    try {
      await gateway.deleteFeedback({ token, feedbackId });
      setItems((prev) => (prev ? prev.filter((f) => f.id !== feedbackId) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SectionHeader
        title="Feedbacks"
        icon={MessageCircle}
        count={items?.length}
      />
      {error ? (
        <ErrorBlock message={error} />
      ) : !items ? (
        <ul aria-label="Carregando feedbacks" className="mt-4 space-y-3">
          {[0, 1].map((i) => (
            <li
              key={i}
              className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-kudo"
            >
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-slate-100" />
                <span className="h-3 w-20 rounded bg-slate-100" />
                <span className="h-3 w-16 rounded bg-slate-100" />
              </div>
              <span className="mt-3 block h-4 w-full rounded bg-slate-100" />
              <span className="mt-2 block h-4 w-2/3 rounded bg-slate-100" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-kudo">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-semibold text-slate-900">
            Nenhum feedback ainda.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Mensagens enviadas pelos participantes vão aparecer aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" data-testid="moderation-feedbacks">
          {items.map((f) => (
            <KudoCard
              key={f.id}
              variant="moderation"
              feedback={f}
              profilesById={profilesById}
              onDelete={() => handleDelete(f.id)}
              deleting={busyId === f.id}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function ProfilesSection({
  token,
  eventId,
  gateway,
}: {
  token: string;
  eventId: string;
  gateway: OwnedEventsGateway;
}) {
  const [items, setItems] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateway
      .profiles({ token, eventId })
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [token, eventId, gateway]);

  async function handleDelete(profileId: string) {
    setBusyId(profileId);
    try {
      await gateway.deleteProfile({ token, profileId });
      setItems((prev) => (prev ? prev.filter((p) => p.id !== profileId) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SectionHeader title="Participantes" icon={Users} count={items?.length} />
      {error ? (
        <ErrorBlock message={error} />
      ) : !items ? (
        <ul
          aria-label="Carregando participantes"
          className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-kudo"
        >
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
              <span className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-kudo">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-semibold text-slate-900">
            Sem participantes ainda.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Quem entrar pelo link do evento vai aparecer aqui.
          </p>
        </div>
      ) : (
        <ul
          data-testid="moderation-profiles"
          className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-kudo"
        >
          {items.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/60 sm:px-5"
            >
              <Avatar name={p.displayName} imageUrl={p.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {p.displayName}
                </p>
                {p.isAdmin && (
                  <span className="mt-0.5 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    admin
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={busyId === p.id}
                onClick={() => handleDelete(p.id)}
                aria-label="Remover"
                title="Remover participante"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
