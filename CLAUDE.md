# CLAUDE.md — Contexto para colaboração com IA

Este arquivo é a fonte de verdade para qualquer agente (humano ou IA) trabalhando no FastKudos. Leia antes de propor mudanças.

## 1. Visão do produto

FastKudos é uma PWA de baixa fricção para eventos de integração: participantes entram via link `fastkudos.app/e/:slug`, informam apenas o nome (sessão "anônima") e trocam kudos em tempo real. Spec completa: `ESPEC_INICIAL.md`.

## 2. Override arquitetural em relação à spec

A spec original previa **Supabase** como BaaS (auth, Postgres+RLS, Realtime). Por decisão de produto, o **banco** foi trocado para **Neon** (Postgres serverless puro). Como Neon não oferece auth nem realtime, implementamos esses serviços em backend próprio:

- **Banco**: Neon (Postgres) via `@neondatabase/serverless`
- **Backend**: Hono em Cloudflare Workers
- **ORM**: Drizzle + drizzle-kit
- **Auth**: JWT HS256 próprio (anônimo para participantes, email/senha para admins)
- **Realtime**: WebSocket via Durable Objects (1 DO por `event_id`)
- **Frontend**: React + Vite + Tailwind + PWA

A política de segurança equivalente a RLS é implementada como **policies em código** (use cases + middleware), com testes de integração cobrindo a matriz de tentativas negadas (cross-event, delete sem owner, etc.).

## 3. Estrutura

```
apps/
  web/    — PWA React (porta 5173)
  api/    — Worker Hono (porta 8787 em dev)
packages/
  shared/ — zod schemas e tipos consumidos pelos dois apps
```

Cada feature segue **clean architecture**:

```
features/<slice>/
  domain/        # entidades + regras puras (sem I/O, sem framework)
  application/   # use cases (orquestram via ports injetadas)
  infra/         # adapters (Drizzle no back, fetch/WS no front)
  ui/            # componentes React + hooks (apenas no web)
```

**Regra de ouro**: dependências sempre apontam para dentro (`ui` → `application` → `domain`; `infra` implementa interfaces de `domain`/`application`).

## 4. Política de TDD (obrigatória)

1. **Red → Green → Refactor.** Nada entra sem teste.
2. Escolha a camada **mais baixa** onde o comportamento pode ser expresso. Regra pura → unit em `domain`. Comportamento que cruza I/O → integração.
3. **Bug encontrado vira teste de regressão antes do fix.** Sem exceção.
4. Use cases recebem ports por injeção; testes injetam fakes (`test/fakes/`).
5. Factories de entidades em `test/factories/` evitam duplicação.

## 5. Estratégia de testes

| Camada | Ferramenta | Onde roda |
|---|---|---|
| Domain (unit) | Vitest | qualquer lugar |
| Application (unit, com fakes) | Vitest | qualquer lugar |
| API integração | Vitest + Postgres efêmero (testcontainers) | local + CI |
| UI component | Vitest + Testing Library + jsdom | local + CI |
| E2E | Playwright contra preview builds | local + CI |

Sem `pg-mem` — preferimos Postgres real para evitar mock/prod skew.

## 6. Convenções

- **TypeScript estrito** em todos os pacotes.
- **Zod schemas** em `packages/shared` são fonte única para DTOs; backend valida na borda, front valida pré-submit.
- **Comentários**: por padrão, nenhum. Só quando o **porquê** for não-óbvio (invariante escondida, workaround documentado).
- **Sem código morto**: feature flags só quando há decisão de rollout; senão, delete.
- **Mensagens de commit**: imperativas, pt-BR ou inglês consistente por commit.

## 7. Comandos comuns

Ver `README.md`. Adicionalmente:

```bash
pnpm -F @fastkudos/api db:generate    # SQL a partir do schema Drizzle
pnpm -F @fastkudos/api db:migrate     # aplica em DATABASE_URL
pnpm -F @fastkudos/api db:seed        # popula evento demo (apenas dev)
```

## 8. Variáveis de ambiente

Ver `.env.example`. Nunca commitar `.env`. Em produção, segredos do Worker via `wrangler secret put`.

## 9. Fluxo de migrations

1. Edite `apps/api/drizzle/schema.ts`.
2. `pnpm -F @fastkudos/api db:generate` gera SQL em `apps/api/drizzle/migrations/`.
3. Revise o SQL gerado; ajuste manualmente se necessário (ex.: backfill).
4. Commit do schema + SQL juntos.
5. `pnpm -F @fastkudos/api db:migrate` aplica.

## 10. Checklist de PR

- [ ] Testes verdes (unit + integração + e2e quando aplicável)
- [ ] Lint e typecheck verdes
- [ ] Sem código morto, sem comentários supérfluos
- [ ] Se mexeu em schema ou autorização: teste cobrindo tentativa negada
- [ ] Se corrigiu bug: teste de regressão presente
- [ ] CLAUDE.md / README atualizados se mudaram comandos ou arquitetura

## 11. Sub-agentes recomendados

Ao trabalhar com Claude Code, prefira delegar para agentes focados em vez de fazer tudo no fluxo principal. Prompts sugeridos:

- **tdd-runner** — "Implemente <requisito> por TDD. Comece pelo teste falhando na camada mais baixa cabível. Não pule etapas."
- **regression-writer** — "Bug: <descrição>. Escreva primeiro um teste que reproduza o bug; só então proponha o fix."
- **authz-reviewer** — "Revise este endpoint/use case quanto a vazamento entre eventos e escalada de privilégio. Aponte tentativas negadas que faltam testes."
- **simplifier** — "Passe de simplificação: encontre duplicação, abstrações prematuras, código morto. Proponha diff."
