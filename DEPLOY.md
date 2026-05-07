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
Domains, adicione `api.<seu-dominio>` (substitua pelo seu domínio).

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
| Environment variable | `VITE_API_URL=https://<api-host>` (URL do Worker) |
| Node version | 20 |

Cloudflare Pages instala o pnpm via corepack quando detecta `packageManager`.
O build roda em CI Cloudflare a cada push.

### Deploy via CLI (alternativa)

```bash
cd apps/web
VITE_API_URL=https://<api-host> pnpm build
pnpm deploy:pages   # `wrangler pages deploy dist --project-name=fastkudos-web`
```

O arquivo `public/_redirects` (`/*  /index.html  200`) garante o roteamento
SPA do React Router em rotas como `/e/:slug` e `/admin/events/:id`.

## 4. CORS e domínios

Em produção, defina o secret `ALLOWED_ORIGINS` com a lista de origens
permitidas (separadas por vírgula). Quando ausente, a API libera `*`
(somente para dev).

```bash
echo 'https://app.exemplo.com,https://www.app.exemplo.com' \
  | pnpm exec wrangler secret put ALLOWED_ORIGINS
```

`http://localhost:5173` e `http://localhost:4173` são sempre incluídos
para o fluxo de dev local.

## 5. WebSocket (mural realtime)

O front conecta em `wss://<api-host>/events/:slug/stream?token=<jwt>`.
Cloudflare Workers suportam WebSockets nativamente; nada extra a configurar.
O Durable Object `EventChannel` faz fan-out por evento.

## 6. Bootstrap do primeiro admin

Não há rota pública de signup. Crie o admin diretamente no banco:

```bash
# gere um hash localmente (mesmo limite de iterações que o Worker usa)
node --experimental-strip-types -e "
import('./apps/api/src/auth/password.ts').then(async (m) => {
  console.log(await m.hashPassword('SENHA_DESEJADA'));
});
"

# insira no Neon (psql ou dashboard SQL):
INSERT INTO admin_users(email, password_hash)
VALUES ('SEU_EMAIL', 'pbkdf2$100000$...');
```

Depois faça login em `https://<dominio-front>/admin/login` e crie eventos
pelo dashboard.

## 7. Smoke test pós-deploy

```bash
# health check
curl https://<api-host>/health
# {"status":"ok"}

# criar evento via API com token admin
curl -X POST https://<api-host>/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'
# {"token":"...","admin":{...}}
```

Abra `https://<dominio-front>/e/<slug>` em duas abas com nomes diferentes,
envie um kudo de uma para outra e confirme que aparece no mural e como
toast em tempo real.

## 8. Rollback

- API: `wrangler rollback` ou redeploy a partir de um commit anterior
- Web: Cloudflare Pages mantém todos os deploys; promova um anterior pelo
  painel
- Banco: Neon tem branching; antes de migration arriscada, crie uma branch
  para validar
