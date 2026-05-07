import { Link } from 'react-router-dom';
import { ArrowRight, CalendarPlus, MessageCircle, QrCode, Sparkles } from 'lucide-react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { KudoCard } from '../../../components/ui/KudoCard';

const GITHUB_REPO_URL = 'https://github.com/petry/fastkudos';

const PREVIEW_PROFILES = new Map<string, Profile>([
  ['ana', { id: 'ana', displayName: 'Ana', eventId: 'demo', isAdmin: false }],
  ['bruno', { id: 'bruno', displayName: 'Bruno', eventId: 'demo', isAdmin: false }],
  ['carla', { id: 'carla', displayName: 'Carla', eventId: 'demo', isAdmin: false }],
  ['diego', { id: 'diego', displayName: 'Diego', eventId: 'demo', isAdmin: false }],
]);

const PREVIEW_KUDOS: Feedback[] = [
  {
    id: 'p1',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    senderId: 'ana',
    receiverId: 'bruno',
    eventId: 'demo',
    content: 'Mandou super bem na apresentação de hoje! Ficou tudo claríssimo.',
  },
  {
    id: 'p2',
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    senderId: 'carla',
    receiverId: 'diego',
    eventId: 'demo',
    content: 'Obrigada pelo apoio durante a sprint, fez toda a diferença.',
  },
];

type Step = {
  icon: typeof CalendarPlus;
  title: string;
  description: string;
  cta?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    icon: CalendarPlus,
    title: 'Crie seu evento',
    description: 'Adicione o nome e receba um mural de feedbacks.',
    cta: { label: 'Começar agora', to: '/login' },
  },
  {
    icon: QrCode,
    title: 'Divulgue',
    description: 'Entregue o link ou QR code criado nas suas apresentações.',
  },
  {
    icon: Sparkles,
    title: 'Envie e receba kudos',
    description:
      'Reconheça seus colegas em tempo real e veja o mural se encher de boas mensagens.',
  },
];

export function HomePage() {
  return (
    <main className="relative min-h-screen">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fork me on GitHub"
        className="github-corner absolute right-0 top-0 z-20"
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 250 250"
          aria-hidden="true"
          className="block fill-slate-900 text-white"
        >
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
          <path
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
            fill="currentColor"
            className="octocat-arm"
          />
          <path
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.1 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
            fill="currentColor"
          />
        </svg>
      </a>
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-400 to-rose-400 px-6 py-16 text-white md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_60%,white,transparent_45%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Reconhecimento em tempo real
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">FastKudos</h1>
          <p className="mt-4 text-lg text-white/90 md:text-xl">
            Reconhecimento entre colegas, em tempo real.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 md:text-base">
            Transforma eventos de integração em uma chuva de kudos. Sem login, sem atrito.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-sky-700 shadow-lg shadow-sky-900/20 transition hover:bg-sky-50 hover:shadow-xl"
            >
              Criar evento agora
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="text-xs text-white/80">
              Grátis. Sem cadastro para participantes.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-kudo"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-slate-400">0{idx + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                {step.cta && (
                  <div className="mt-auto pt-4">
                    <Link
                      to={step.cta.to}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-rose-600"
                    >
                      {step.cta.label}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16 md:pb-24">
        <div className="flex items-center justify-center gap-2 text-slate-700">
          <MessageCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Um mural interativo para exibir elogios</h2>
        </div>
        <ul className="mt-6 space-y-3">
          {PREVIEW_KUDOS.map((kudo) => (
            <KudoCard
              key={kudo.id}
              variant="mural"
              feedback={kudo}
              profilesById={PREVIEW_PROFILES}
            />
          ))}
        </ul>
      </section>

      <footer className="border-t border-slate-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <p>FastKudos · feito para celebrar pessoas em eventos</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-800"
          >
            Sou organizador
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
