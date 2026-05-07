import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { Event } from '@fastkudos/shared';
import type { LoggedSessionStore } from '../../admin/domain/ports';
import type { SuperadminGateway, SuperadminUser } from '../domain/ports';

export interface SuperadminPageProps {
  session: LoggedSessionStore;
  gateway: SuperadminGateway;
}

export function SuperadminPage({ session, gateway }: SuperadminPageProps) {
  const [current] = useState(() => session.load());
  const [events, setEvents] = useState<Event[] | null>(null);
  const [users, setUsers] = useState<SuperadminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    Promise.all([
      gateway.listEvents({ token: current.token }),
      gateway.listUsers({ token: current.token }),
    ])
      .then(([e, u]) => {
        if (cancelled) return;
        setEvents(e);
        setUsers(u);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, [current, gateway]);

  if (!current) return <Navigate to="/login" replace />;
  if (current.user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;

  async function toggleRole(u: SuperadminUser) {
    if (!current) return;
    const next = u.role === 'superadmin' ? 'user' : 'superadmin';
    try {
      const updated = await gateway.updateUserRole({ token: current.token, userId: u.id, role: next });
      setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? updated : x)) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/dashboard" className="text-sm text-slate-600 underline">
        ← Voltar para meu dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Painel superadmin</h1>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Todos os eventos</h2>
        {!events ? (
          <p>Carregando…</p>
        ) : events.length === 0 ? (
          <p className="text-slate-500">Sem eventos cadastrados.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200" data-testid="superadmin-events">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {e.name} <code className="text-xs text-slate-500">/e/{e.slug}</code>
                </span>
                <Link
                  to={`/dashboard/events/${e.id}`}
                  className="text-sm text-sky-700 underline shrink-0"
                >
                  Moderar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Usuários</h2>
        {!users ? (
          <p>Carregando…</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200" data-testid="superadmin-users">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {u.name} <span className="text-xs text-slate-500">{u.email}</span>{' '}
                  <span
                    className={`text-xs ${u.role === 'superadmin' ? 'text-amber-700' : 'text-slate-500'}`}
                  >
                    [{u.role}]
                  </span>
                </span>
                {u.id !== current.user.id && (
                  <button
                    type="button"
                    onClick={() => toggleRole(u)}
                    className="shrink-0 text-sm text-sky-700 underline"
                  >
                    {u.role === 'superadmin' ? 'rebaixar' : 'promover'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
