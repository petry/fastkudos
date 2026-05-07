# Deploy — FastKudos

Stack de produção:
- **Banco**: Neon (Postgres serverless)
- **API**: Cloudflare Workers (Hono + Durable Objects)
- **Web**: Cloudflare Pages (build estático do Vite)
- **Auth**: Google OAuth 2.0 (futuro: GitHub, LinkedIn)

> **Pré-requisitos**: você precisa de um `<API_HOST>` (URL do Worker) e um
> `<WEB_HOST>` (URL do Pages) **decididos antes** de configurar OAuth e CORS,
> porque eles entram nos secrets e nas URIs cadastradas no Google. Em primeira
> ronda use as URLs padrão (`fastkudos-api.<conta>.workers.dev` e
> `fastkudos-web.pages.dev`); custom domains ficam pra depois.

## 1. Provisionar Neon

1. Crie um projeto em https://console.neon.tech.
2. Recomendado: separe **branch `main`** para produção e crie uma **branch
   `dev`** para desenvolvimento. Ambas têm connection string própria.
3. Copie a connection string da branch de prod
   (`postgres://user:pass@host/db?sslmode=require`).
4. Aplique as migrations apontando `DATABASE_URL` para o Neon de prod:
   ```bash
   DATABASE_URL='postgres://...prod...' pnpm -F @fastkudos/api db:migrate
   ```
   Você deve ver `applying 0000_shiny_spyke.sql` e `applying 0001_oauth_users.sql`.

## 2. Configurar Google OAuth (Cloud Console)

Crie um **Client ID separado** para produção (não reuse o de dev).

1. https://console.cloud.google.com → seu projeto.
2. **APIs & Services → OAuth consent screen** → adicione `<WEB_HOST>` em
   "Authorized domains" e seus emails de teste em "Test users" enquanto o
   app estiver em modo Testing. Para escopos `openid email profile` o Google
   permite **publicar** sem verificação manual.
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized JavaScript origins**: `https://<WEB_HOST>`
   - **Authorized redirect URIs**: `https://<API_HOST>/auth/google/callback`
4. Anote `Client ID` e `Client secret`.

## 3. Deploy da API (Cloudflare Workers)

```bash
cd apps/api
# autenticar (interativo, abre browser)
pnpm exec wrangler login

# segredos (não vão para git)
pnpm exec wrangler secret put DATABASE_URL          # connection string Neon prod
pnpm exec wrangler secret put JWT_SECRET            # openssl rand -hex 32
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put OAUTH_REDIRECT_URI    # https://<API_HOST>/auth/google/callback
pnpm exec wrangler secret put WEB_BASE_URL          # https://<WEB_HOST>
pnpm exec wrangler secret put ALLOWED_ORIGINS       # https://<WEB_HOST>

# deploy
pnpm deploy:worker   # equivale a `wrangler deploy`
```

Após o deploy, anote a URL real do Worker (algo como
`https://fastkudos-api.<conta>.workers.dev`). Se não bater com o
`<API_HOST>` que você usou nos secrets/Google, atualize as duas pontas.

O Durable Object `EventChannel` é criado automaticamente pelo
`wrangler.toml` (binding `EVENT_CHANNEL`).

### Custom domain (opcional)

Painel Cloudflare → Workers & Pages → fastkudos-api → Settings → Triggers →
Custom Domains, adicione `api.<seu-dominio>`. Se trocar o domínio depois,
**reapplique** `OAUTH_REDIRECT_URI` e atualize o redirect no Google Console.

## 4. Deploy do Web (Cloudflare Pages)

### Primeira vez (recomendado: integração com Git)

Painel Cloudflare → Workers & Pages → Create application → Pages → Connect
to Git:

| Campo | Valor |
|---|---|
| Framework preset | None |
| Build command | `pnpm install --frozen-lockfile && pnpm -F @fastkudos/web build` |
| Build output directory | `apps/web/dist` |
| Root directory | (vazio) |
| Environment variable | `VITE_API_URL=https://<API_HOST>` |
| Node version | 20 |

`VITE_API_URL` é lido **em build time** pelo Vite. Toda vez que o `<API_HOST>`
mudar, force rebuild no Pages (push novo ou retry deployment).

O arquivo `public/_redirects` (`/*  /index.html  200`) garante o roteamento
SPA do React Router em rotas como `/e/:slug`, `/dashboard/events/:id`,
`/auth/callback` e `/superadmin`.

### Deploy via CLI (alternativa one-off)

```bash
cd apps/web
VITE_API_URL=https://<API_HOST> pnpm build
pnpm deploy:pages   # wrangler pages deploy dist --project-name=fastkudos-web
```

## 5. Bootstrap do primeiro superadmin

Não há rota pública de signup. O fluxo é:

1. **Inserir o user no banco** com `oauth_provider='legacy'` e
   `oauth_sub=<qualquer string única>`. O email tem que bater com o da conta
   Google que você vai usar para logar:

   ```sql
   INSERT INTO users (email, name, role, oauth_provider, oauth_sub)
   VALUES ('SEU_EMAIL', 'Seu Nome', 'superadmin', 'legacy', 'bootstrap-1');
   ```

2. **Logar via Google** em `https://<WEB_HOST>/login`. O callback OAuth
   detecta o registro `legacy` pelo email e **promove**: troca `oauth_provider`
   para `google`, atualiza `oauth_sub` com o `sub` real do Google e preserva
   `id` e `role='superadmin'`.

3. Você cai em `/dashboard` com o link **"Painel superadmin →"** disponível.
   Daí pode promover outros users via UI ou SQL (`UPDATE users SET role='superadmin' WHERE email='...'`).

## 6. Smoke test pós-deploy

```bash
# health
curl https://<API_HOST>/health
# {"status":"ok"}

# OAuth start (deve retornar 302 para accounts.google.com)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  "https://<API_HOST>/auth/google/start"
```

Manual:
1. Abra `https://<WEB_HOST>/login` → "Continuar com Google" → escolhe a
   conta seedada → cai em `/dashboard`.
2. Crie um evento de teste, copie o slug.
3. Abra `https://<WEB_HOST>/e/<slug>` na mesma aba → auto-join silencioso.
4. Em janela anônima, abra `https://<WEB_HOST>/e/<slug>` → form de nome.
   Manda um kudo de uma sessão para outra e confirma que aparece no mural
   em tempo real (Durable Object + WebSocket).

## 7. Realtime (WebSocket)

O front conecta em `wss://<API_HOST>/events/:slug/stream?token=<jwt>`.
Cloudflare Workers suportam WebSockets nativamente; nada extra a configurar.
O Durable Object `EventChannel` faz fan-out por evento.

## 8. Rollback

- **API**: `pnpm exec wrangler rollback` ou redeploy a partir de um commit
  anterior. Cloudflare guarda histórico no painel.
- **Web**: Pages mantém todos os deploys; promova um anterior pelo painel
  (Production → Promote).
- **Banco**: Neon suporta point-in-time restore na branch e tem branching.
  Antes de migration arriscada, crie uma branch a partir da prod, aplique a
  migration nela, valide, e só então mescle.

## 9. Variáveis e secrets — referência rápida

| Onde | Nome | Origem |
|---|---|---|
| Worker (secret) | `DATABASE_URL` | Neon prod |
| Worker (secret) | `JWT_SECRET` | `openssl rand -hex 32` |
| Worker (secret) | `GOOGLE_CLIENT_ID` | Google Cloud Console |
| Worker (secret) | `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| Worker (secret) | `OAUTH_REDIRECT_URI` | `https://<API_HOST>/auth/google/callback` |
| Worker (secret) | `WEB_BASE_URL` | `https://<WEB_HOST>` |
| Worker (secret) | `ALLOWED_ORIGINS` | `https://<WEB_HOST>` (csv se múltiplos) |
| Pages (env) | `VITE_API_URL` | `https://<API_HOST>` (build time) |

`http://localhost:5173` e `http://localhost:4173` são sempre incluídos no
CORS para dev local mesmo que `ALLOWED_ORIGINS` esteja setado.
