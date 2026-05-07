# FastKudos

PWA de troca de kudos em eventos de integração. Monorepo pnpm com:

- `apps/web` — PWA React + Vite + Tailwind
- `apps/api` — Hono em Cloudflare Workers (auth JWT, REST, WebSocket via Durable Objects)
- `packages/shared` — schemas zod e tipos compartilhados

## Pré-requisitos

- Node 20+
- pnpm 10+
- Docker (para Postgres em testes de integração)
- Wrangler (instalado como devDep no `apps/api`)

## Setup

```bash
pnpm install
cp .env.example .env
# preencha DATABASE_URL (Neon) e JWT_SECRET
```

## Comandos

| Comando | Descrição |
|---|---|
| `pnpm dev` | sobe `web` (5173) e `api` (8787) em paralelo |
| `pnpm test` | unit + component em todos os pacotes |
| `pnpm test:integration` | integração da API contra Postgres efêmero |
| `pnpm test:e2e` | Playwright contra builds preview |
| `pnpm lint` / `pnpm typecheck` | qualidade |
| `pnpm -F @fastkudos/api db:generate` | gera SQL a partir do schema Drizzle |
| `pnpm -F @fastkudos/api db:migrate` | aplica migrations no `DATABASE_URL` |

Ver `CLAUDE.md` para arquitetura, convenções e política de TDD.

## Deploy

Ver `DEPLOY.md` — Cloudflare Pages (web) + Cloudflare Workers (api) + Neon (Postgres).
