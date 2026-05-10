import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopBar } from './TopBar';

function renderTopBar(props: Parameters<typeof TopBar>[0]) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TopBar {...props} />
    </MemoryRouter>,
  );
}

describe('<TopBar>', () => {
  it('renderiza o logo FastKudos com link para a home', () => {
    renderTopBar({ rightSlot: null });
    const logo = screen.getByRole('link', { name: /fastkudos/i });
    expect(logo).toHaveAttribute('href', '/');
  });

  it('renderiza o conteúdo passado em rightSlot', () => {
    renderTopBar({ rightSlot: <span data-testid="right">olá</span> });
    expect(screen.getByTestId('right')).toHaveTextContent('olá');
  });
});
