import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App', () => {
  it('renderiza Home na raiz', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /fastkudos/i })).toBeInTheDocument();
  });

  it('renderiza placeholder do evento em /e/:slug', () => {
    render(
      <MemoryRouter initialEntries={['/e/demo']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/onboarding do participante/i)).toBeInTheDocument();
  });
});
