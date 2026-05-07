import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Send, Sparkles, Users } from 'lucide-react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { KudoCard } from '../../../components/ui/KudoCard';

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

const STEPS = [
  {
    icon: Users,
    title: 'Receba o link',
    description: 'O organizador compartilha um link único do evento (fastkudos.app/e/…).',
  },
  {
    icon: Send,
    title: 'Diga seu nome',
    description: 'Sem cadastro nem senha. Basta o seu nome para entrar e participar.',
  },
  {
    icon: Sparkles,
    title: 'Envie e receba kudos',
    description: 'Reconheça os colegas em tempo real e veja o mural se encher de boas mensagens.',
  },
];

export function HomePage() {
  return (
    <main className="min-h-screen">
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
            A PWA que transforma eventos de integração em uma chuva de kudos. Sem login, sem
            atrito — só o seu nome e o link do evento.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <h2 className="text-center text-2xl font-semibold text-slate-900 md:text-3xl">
          Como funciona
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
          Três passos para começar a celebrar quem está do seu lado.
        </p>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-kudo"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-slate-400">0{idx + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16 md:pb-24">
        <div className="flex items-center justify-center gap-2 text-slate-700">
          <MessageCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Assim fica o mural</h2>
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
            to="/admin/login"
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
