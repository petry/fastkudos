import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App', () => {
  it('renderiza Home na raiz', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /fastkudos/i })).toBeInTheDocument();
  });

  it('renderiza onboarding em /e/:slug', () => {
    render(
      <MemoryRouter initialEntries={['/e/demo']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /entrar no evento/i })).toBeInTheDocument();
  });
});
