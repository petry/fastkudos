import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('trackPageView', () => {
  const originalGtag = window.gtag;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    window.gtag = originalGtag;
    window.history.replaceState({}, '', '/');
  });

  async function loadAndInit() {
    const mod = await import('./analytics');
    mod.initAnalytics('G-TEST');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy as never;
    return { trackPageView: mod.trackPageView, gtagSpy };
  }

  it('remove o fragmento (#) de page_location para evitar vazamento de token', async () => {
    // Cobre o caso onde o usuário aterrissa em /auth/callback#token=... e o
    // page_view dispara antes do callback limpar o hash. O page_location não
    // pode ir para o GA com o token.
    const { trackPageView, gtagSpy } = await loadAndInit();

    window.history.replaceState({}, '', '/auth/callback#token=secret-jwt&redirect=/dashboard');
    trackPageView('/auth/callback');

    const sent = gtagSpy.mock.calls[0]![2] as { page_location: string };
    expect(sent.page_location).not.toContain('secret-jwt');
    expect(sent.page_location).not.toContain('#');
  });

  it('remove a query string de page_location (defesa em profundidade)', async () => {
    // Tokens podem aparecer em query string em fluxos OAuth ou erros; sanitizar
    // ambos hash e search é mais seguro do que apenas hash.
    const { trackPageView, gtagSpy } = await loadAndInit();

    window.history.replaceState({}, '', '/login?token=leaked');
    trackPageView('/login');

    const sent = gtagSpy.mock.calls[0]![2] as { page_location: string };
    expect(sent.page_location).not.toContain('leaked');
    expect(sent.page_location).not.toContain('?');
  });

  it('mantém origin + pathname intactos em page_location', async () => {
    const { trackPageView, gtagSpy } = await loadAndInit();

    window.history.replaceState({}, '', '/dashboard');
    trackPageView('/dashboard');

    const sent = gtagSpy.mock.calls[0]![2] as { page_location: string };
    expect(sent.page_location).toBe(`${window.location.origin}/dashboard`);
  });
});
