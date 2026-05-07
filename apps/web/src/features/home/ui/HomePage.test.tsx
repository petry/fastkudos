import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

function setup() {
  return render(
    <MemoryRouter>
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
    expect(screen.getByText(/receba o link/i)).toBeInTheDocument();
    expect(screen.getByText(/diga seu nome/i)).toBeInTheDocument();
    expect(screen.getByText(/envie e receba/i)).toBeInTheDocument();
  });

  it('mostra preview de kudo no mural', () => {
    setup();
    expect(screen.getByText(/mandou super bem/i)).toBeInTheDocument();
  });

  it('tem link para /admin/login', () => {
    setup();
    const link = screen.getByRole('link', { name: /organizador/i });
    expect(link).toHaveAttribute('href', '/admin/login');
  });
});
