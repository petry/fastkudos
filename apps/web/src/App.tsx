import { Route, Routes } from 'react-router-dom';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/e/:slug" element={<EventPlaceholder />} />
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

function EventPlaceholder() {
  return (
    <main className="mx-auto max-w-md p-6">
      <p>Em breve: onboarding do participante.</p>
    </main>
  );
}
