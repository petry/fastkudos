# Deploy — FastKudos

Stack de produção:
- **Banco**: Neon (Postgres serverless)
- **API**: Cloudflare Workers (Hono + Durable Objects)
- **Web**: Cloudflare Pages (build estático do Vite)

## 1. Provisionar Neon

1. Crie um projeto em https://console.neon.tech
2. Copie a connection string (`postgres://user:pass@host/db?sslmode=require`)
3. Aplique as migrations localmente apontando `DATABASE_URL` para o Neon:
   ```bash
   DATABASE_URL='postgres://...' pnpm -F @fastkudos/api db:migrate
   ```
4. (Opcional, dev) seed inicial:
   ```bash
   DATABASE_URL='postgres://...' pnpm -F @fastkudos/api db:seed
   ```

## 2. Deploy da API (Cloudflare Workers)

```bash
cd apps/api
# autenticar (interativo, abre browser)
pnpm exec wrangler login

# segredos (não vão para git)
pnpm exec wrangler secret put DATABASE_URL    # cole a string Neon
pnpm exec wrangler secret put JWT_SECRET      # gere com: openssl rand -hex 32

# deploy
pnpm deploy:worker   # equivale a `wrangler deploy`
```

Após o deploy, anote a URL do Worker (algo como
`https://fastkudos-api.<account>.workers.dev`). O Durable Object `EventChannel`
já é criado automaticamente pelo `wrangler.toml` (binding `EVENT_CHANNEL`).

### Custom domain (opcional)

No painel Cloudflare → Workers & Pages → fastkudos-api → Triggers → Custom
Domains, adicione `api.fastkudos.app` (substitua pelo seu domínio).

## 3. Deploy do Web (Cloudflare Pages)

### Primeira vez

No painel Cloudflare → Workers & Pages → Create application → Pages → Connect
to Git, conecte o repositório com a configuração:

| Campo | Valor |
|---|---|
| Framework preset | None |
| Build command | `pnpm install --frozen-lockfile && pnpm -F @fastkudos/web build` |
| Build output directory | `apps/web/dist` |
| Root directory | (vazio) |
| Environment variable | `VITE_API_URL=https://api.fastkudos.app` (URL do Worker) |
| Node version | 20 |

Cloudflare Pages instala o pnpm via corepack quando detecta `packageManager`.
O build roda em CI Cloudflare a cada push.

### Deploy via CLI (alternativa)

```bash
cd apps/web
VITE_API_URL=https://api.fastkudos.app pnpm build
pnpm deploy:pages   # `wrangler pages deploy dist --project-name=fastkudos-web`
```

O arquivo `public/_redirects` (`/*  /index.html  200`) garante o roteamento
SPA do React Router em rotas como `/e/:slug` e `/admin/events/:id`.

## 4. CORS e domínios

A API tem `cors()` global aberto (`*`). Para restringir em produção, edite
`apps/api/src/index.ts`:

```ts
app.use('*', cors({ origin: ['https://fastkudos.app', 'https://www.fastkudos.app'] }));
```

## 5. WebSocket (mural realtime)

O front conecta em `wss://<api-host>/events/:slug/stream?token=<jwt>`.
Cloudflare Workers suportam WebSockets nativamente; nada extra a configurar.
O Durable Object `EventChannel` faz fan-out por evento.

## 6. Bootstrap do primeiro admin

Não há rota pública de signup. Crie o admin diretamente no banco:

```bash
# gere um hash localmente
node -e "
import('./apps/api/src/auth/password.ts').then(async (m) => {
  console.log(await m.hashPassword('senha-aqui'));
});
"

# insira no Neon (psql ou dashboard SQL):
INSERT INTO admin_users(email, password_hash)
VALUES ('voce@empresa.com', 'pbkdf2$210000$...');
```

Depois faça login em `https://fastkudos.app/admin/login` e crie eventos pelo
dashboard.

## 7. Smoke test pós-deploy

```bash
# health check
curl https://api.fastkudos.app/health
# {"status":"ok"}

# criar evento via API com token admin
curl -X POST https://api.fastkudos.app/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"voce@empresa.com","password":"..."}'
# {"token":"...","admin":{...}}
```

Abra `https://fastkudos.app/e/<slug>` em duas abas com nomes diferentes,
envie um kudo de uma para outra e confirme que aparece no mural e como
toast em tempo real.

## 8. Rollback

- API: `wrangler rollback` ou redeploy a partir de um commit anterior
- Web: Cloudflare Pages mantém todos os deploys; promova um anterior pelo
  painel
- Banco: Neon tem branching; antes de migration arriscada, crie uma branch
  para validar
