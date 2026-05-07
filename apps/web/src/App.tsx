import { Route, Routes, useNavigate } from 'react-router-dom';
import { HomePage } from './features/home/ui/HomePage';
import { OnboardingPage } from './features/onboarding/ui/OnboardingPage';
import { httpAuthGateway } from './features/onboarding/infra/http-auth-gateway';
import { localSessionStore } from './features/onboarding/infra/local-session-store';
import { httpParticipantsGateway } from './features/participants/infra/http-participants-gateway';
import { httpKudosGateway } from './features/kudos/infra/http-kudos-gateway';
import { httpInboxGateway } from './features/inbox/infra/http-inbox-gateway';
import { httpMuralGateway } from './features/mural/infra/http-mural-gateway';
import { websocketStream } from './features/mural/infra/websocket-stream';
import { AdminLoginPage } from './features/admin/ui/AdminLoginPage';
import { AdminDashboardPage } from './features/admin/ui/AdminDashboardPage';
import { ModerationPage } from './features/admin/ui/ModerationPage';
import {
  httpAdminAuthGateway,
  httpAdminEventsGateway,
} from './features/admin/infra/http-gateways';
import { localAdminSessionStore } from './features/admin/infra/local-admin-session';

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';
const auth = httpAuthGateway(apiUrl);
const session = localSessionStore();
const participants = httpParticipantsGateway(apiUrl);
const kudos = httpKudosGateway(apiUrl);
const inbox = httpInboxGateway(apiUrl);
const mural = httpMuralGateway(apiUrl);
const stream = websocketStream(apiUrl);
const adminAuth = httpAdminAuthGateway(apiUrl);
const adminEvents = httpAdminEventsGateway(apiUrl);
const adminSession = localAdminSessionStore();

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/e/:slug"
        element={
          <OnboardingPage
            auth={auth}
            session={session}
            participants={participants}
            kudos={kudos}
            inbox={inbox}
            stream={stream}
            mural={mural}
          />
        }
      />
      <Route path="/admin/login" element={<AdminLoginRoute />} />
      <Route
        path="/admin"
        element={<AdminDashboardPage session={adminSession} events={adminEvents} />}
      />
      <Route
        path="/admin/events/:id"
        element={<ModerationPage session={adminSession} gateway={adminEvents} />}
      />
    </Routes>
  );
}

function AdminLoginRoute() {
  const navigate = useNavigate();
  return (
    <AdminLoginPage
      auth={adminAuth}
      session={adminSession}
      onLoggedIn={() => navigate('/admin')}
    />
  );
}

