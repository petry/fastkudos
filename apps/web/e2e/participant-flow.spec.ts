import { expect, test, type Route } from '@playwright/test';

// Os testes E2E mockam toda a API via page.route — não precisam de Worker/Neon
// rodando. Cobrem o fluxo crítico do participante de ponta a ponta no browser.

const PROFILE_ME = { id: 'p-me', displayName: 'Alice', eventId: 'e1', isAdmin: false };
const PROFILE_BOB = { id: 'p-bob', displayName: 'Bob', eventId: 'e1', isAdmin: false };

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test.describe('fluxo do participante', () => {
  test('faz onboarding, vê participantes e envia kudo', async ({ page }) => {
    // bloqueia WebSocket pra evitar timeouts/ruído (mural fica vazio mas não quebra)
    await page.route('**/events/**/stream**', (r) => r.abort());

    await page.route('**/auth/anon', async (route) => {
      const req = route.request().postDataJSON() as { displayName: string };
      await json(route, 201, {
        token: 'fake-token',
        profile: { ...PROFILE_ME, displayName: req.displayName },
      });
    });

    await page.route('**/events/demo/profiles', (r) =>
      json(r, 200, {
        event: { id: 'e1', name: 'Encontro Demo', slug: 'demo' },
        profiles: [PROFILE_ME, PROFILE_BOB],
      }),
    );

    await page.route('**/inbox', (r) => json(r, 200, { feedbacks: [] }));

    let kudoBody: { receiverId: string; content: string } | null = null;
    await page.route('**/kudos', async (route) => {
      kudoBody = route.request().postDataJSON();
      await json(route, 201, {
        feedback: {
          id: 'f1',
          createdAt: new Date().toISOString(),
          senderId: PROFILE_ME.id,
          receiverId: kudoBody!.receiverId,
          eventId: 'e1',
          content: kudoBody!.content,
        },
      });
    });

    await page.goto('/e/demo');

    // onboarding
    await page.getByLabel('Seu nome').fill('Alice');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByTestId('welcome')).toHaveText('Olá, Alice!');

    // lista exclui o próprio user
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Alice', { exact: true })).toHaveCount(0);

    // envia kudo para Bob
    await page.getByRole('button', { name: 'Enviar kudo' }).click();
    await page.getByLabel('Mensagem').fill('mandou bem!');
    await page.getByRole('button', { name: /^enviar$/i }).click();

    await expect(page.getByRole('status')).toContainText('Bob');
    expect(kudoBody).toEqual({ receiverId: PROFILE_BOB.id, content: 'mandou bem!' });
  });

  test('reaproveita sessão do localStorage e pula onboarding', async ({ page, context }) => {
    await page.route('**/events/**/stream**', (r) => r.abort());
    await page.route('**/events/demo/profiles', (r) =>
      json(r, 200, {
        event: { id: 'e1', name: 'Encontro Demo', slug: 'demo' },
        profiles: [PROFILE_ME, PROFILE_BOB],
      }),
    );
    await page.route('**/inbox', (r) => json(r, 200, { feedbacks: [] }));

    // pré-popula a sessão (mesma chave do localSessionStore)
    await context.addInitScript(() => {
      window.localStorage.setItem(
        'fastkudos:session:demo',
        JSON.stringify({
          token: 'cached-token',
          profile: { id: 'p-me', displayName: 'Alice', eventId: 'e1', isAdmin: false },
        }),
      );
    });

    await page.goto('/e/demo');

    await expect(page.getByTestId('welcome')).toHaveText('Olá, Alice!');
    // formulário não aparece quando já tem sessão
    await expect(page.getByLabel('Seu nome')).toHaveCount(0);
  });
});
