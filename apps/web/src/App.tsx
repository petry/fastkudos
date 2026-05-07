import { Route, Routes } from 'react-router-dom';
import { HomePage } from './features/home/ui/HomePage';
import { OnboardingPage } from './features/onboarding/ui/OnboardingPage';
import { httpAuthGateway } from './features/onboarding/infra/http-auth-gateway';
import { localSessionStore } from './features/onboarding/infra/local-session-store';
import { httpParticipantsGateway } from './features/participants/infra/http-participants-gateway';
import { httpKudosGateway } from './features/kudos/infra/http-kudos-gateway';
import { httpInboxGateway } from './features/inbox/infra/http-inbox-gateway';
import { InboxPage } from './features/inbox/ui/InboxPage';
import { httpMuralGateway } from './features/mural/infra/http-mural-gateway';
import { websocketStream } from './features/mural/infra/websocket-stream';
import { LoginPage } from './features/admin/ui/LoginPage';
import { AuthCallbackPage } from './features/admin/ui/AuthCallbackPage';
import { DashboardPage } from './features/admin/ui/DashboardPage';
import { ModerationPage } from './features/admin/ui/ModerationPage';
import {
  httpUserAuthGateway,
  httpOwnedEventsGateway,
} from './features/admin/infra/http-gateways';
import { localUserSessionStore } from './features/admin/infra/local-user-session';
import { SuperadminPage } from './features/superadmin/ui/SuperadminPage';
import { httpSuperadminGateway } from './features/superadmin/infra/http-superadmin-gateway';

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';
const auth = httpAuthGateway(apiUrl);
const session = localSessionStore();
const participants = httpParticipantsGateway(apiUrl);
const kudos = httpKudosGateway(apiUrl);
const inbox = httpInboxGateway(apiUrl);
const mural = httpMuralGateway(apiUrl);
const stream = websocketStream(apiUrl);
const userAuth = httpUserAuthGateway(apiUrl);
const ownedEvents = httpOwnedEventsGateway(apiUrl);
const userSession = localUserSessionStore();
const superadmin = httpSuperadminGateway(apiUrl);

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
            userSession={userSession}
            participants={participants}
            kudos={kudos}
            stream={stream}
            mural={mural}
          />
        }
      />
      <Route
        path="/e/:slug/inbox"
        element={<InboxPage session={session} participants={participants} inbox={inbox} />}
      />
      <Route path="/login" element={<LoginPage auth={userAuth} />} />
      <Route
        path="/auth/callback"
        element={<AuthCallbackPage session={userSession} auth={userAuth} />}
      />
      <Route
        path="/dashboard"
        element={<DashboardPage session={userSession} events={ownedEvents} />}
      />
      <Route
        path="/dashboard/events/:id"
        element={<ModerationPage session={userSession} gateway={ownedEvents} />}
      />
      <Route
        path="/superadmin"
        element={<SuperadminPage session={userSession} gateway={superadmin} />}
      />
    </Routes>
  );
}
