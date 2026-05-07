import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';
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

  return (
    <main className="mx-auto max-w-md p-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Meus eventos</h1>
        <button
          type="button"
          onClick={() => {
            session.clear();
            window.location.assign('/login');
          }}
          className="text-sm text-slate-600 underline"
        >
          Sair
        </button>
      </header>
      <p className="mt-1 text-sm text-slate-600">
        {current.user.name} · {current.user.email}
      </p>
      {current.user.role === 'superadmin' && (
        <p className="mt-1 text-sm">
          <Link to="/superadmin" className="text-sky-700 underline">
            Painel superadmin →
          </Link>
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Criar evento</h2>
        <div className="mt-2">
          <CreateEventForm
            token={current.token}
            gateway={events}
            onCreated={() => setListKey((k) => k + 1)}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Lista</h2>
        <div className="mt-2">
          <EventsList key={listKey} token={current.token} gateway={events} />
        </div>
      </section>
    </main>
  );
}
