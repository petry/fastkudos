import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';
import { AppShell } from './AppShell';
import { CreateEventForm } from './CreateEventForm';
import { EventsList } from './EventsList';

export interface DashboardPageProps {
  session: LoggedSessionStore;
  events: OwnedEventsGateway;
}

export function DashboardPage({ session, events }: DashboardPageProps) {
  const current = session.load();
  const [listKey, setListKey] = useState(0);

  if (!current) return <Navigate to="/login" replace />;

  function handleSignOut() {
    session.clear();
    window.location.assign('/login');
  }

  return (
    <AppShell current={current.user} onSignOut={handleSignOut}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meus eventos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Crie e gerencie seus murais de kudos.
          </p>
        </div>
        <a
          href="#novo-evento"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-rose-600"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo evento
        </a>
      </header>

      <div className="space-y-8">
        <section id="novo-evento" aria-labelledby="novo-evento-title" className="scroll-mt-24">
          <h2 id="novo-evento-title" className="sr-only">
            Criar evento
          </h2>
          <CreateEventForm
            token={current.token}
            gateway={events}
            onCreated={() => setListKey((k) => k + 1)}
          />
        </section>

        <section aria-labelledby="lista-eventos-title">
          <h2
            id="lista-eventos-title"
            className="mb-3 text-base font-semibold text-slate-900"
          >
            Lista
          </h2>
          <EventsList key={listKey} token={current.token} gateway={events} />
        </section>
      </div>
    </AppShell>
  );
}
