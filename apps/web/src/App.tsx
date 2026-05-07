import { Route, Routes } from 'react-router-dom';
import { OnboardingPage } from './features/onboarding/ui/OnboardingPage';
import { httpAuthGateway } from './features/onboarding/infra/http-auth-gateway';
import { localSessionStore } from './features/onboarding/infra/local-session-store';
import { httpParticipantsGateway } from './features/participants/infra/http-participants-gateway';
import { httpKudosGateway } from './features/kudos/infra/http-kudos-gateway';
import { httpInboxGateway } from './features/inbox/infra/http-inbox-gateway';
import { websocketStream } from './features/mural/infra/websocket-stream';

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';
const auth = httpAuthGateway(apiUrl);
const session = localSessionStore();
const participants = httpParticipantsGateway(apiUrl);
const kudos = httpKudosGateway(apiUrl);
const inbox = httpInboxGateway(apiUrl);
const stream = websocketStream(apiUrl);

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/e/:slug" element={<OnboardingPage auth={auth} session={session} participants={participants} kudos={kudos} inbox={inbox} stream={stream} />} />
    </Routes>
  );
}

function Home() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">FastKudos</h1>
      <p className="mt-2 text-slate-600">
        Acesse via link do seu evento: <code>/e/&lt;slug&gt;</code>.
      </p>
    </main>
  );
}
