import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

function setup() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('<HomePage>', () => {
  it('mostra o título FastKudos', () => {
    setup();
    expect(screen.getByRole('heading', { name: /fastkudos/i, level: 1 })).toBeInTheDocument();
  });

  it('mostra a tagline', () => {
    setup();
    expect(screen.getByText(/reconhecimento entre colegas/i)).toBeInTheDocument();
  });

  it('mostra os 3 passos do "Como funciona"', () => {
    setup();
    expect(screen.getByText(/crie seu evento/i)).toBeInTheDocument();
    expect(screen.getByText(/divulgue/i)).toBeInTheDocument();
    expect(screen.getByText(/envie e receba/i)).toBeInTheDocument();
  });

  it('mostra preview de kudo no mural', () => {
    setup();
    expect(screen.getByText(/mandou super bem/i)).toBeInTheDocument();
  });

  it('tem link para /login', () => {
    setup();
    const link = screen.getByRole('link', { name: /organizador/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('tem CTA primária no hero apontando para /login', () => {
    setup();
    const link = screen.getByRole('link', { name: /criar evento agora/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('tem CTA "Começar agora" no card do passo 1 apontando para /login', () => {
    setup();
    const link = screen.getByRole('link', { name: /começar agora/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('tem link "Fork me on GitHub" para o repositório', () => {
    setup();
    const link = screen.getByRole('link', { name: /fork me on github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/petry/fastkudos');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel') ?? '').toContain('noopener');
  });
});
