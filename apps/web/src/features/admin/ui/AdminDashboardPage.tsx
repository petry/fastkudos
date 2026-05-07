import { Navigate } from 'react-router-dom';
import type { AdminEventsGateway, AdminSessionStore } from '../domain/ports';
import { CreateEventForm } from './CreateEventForm';

export interface AdminDashboardPageProps {
  session: AdminSessionStore;
  events: AdminEventsGateway;
}

export function AdminDashboardPage({ session, events }: AdminDashboardPageProps) {
  const current = session.load();
  if (!current) return <Navigate to="/admin/login" replace />;

  return (
    <main className="mx-auto max-w-md p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <button
          type="button"
          onClick={() => {
            session.clear();
            window.location.assign('/admin/login');
          }}
          className="text-sm text-slate-600 underline"
        >
          Sair
        </button>
      </header>
      <p className="mt-1 text-sm text-slate-600">{current.admin.email}</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Criar evento</h2>
        <div className="mt-2">
          <CreateEventForm token={current.token} gateway={events} />
        </div>
      </section>
    </main>
  );
}
