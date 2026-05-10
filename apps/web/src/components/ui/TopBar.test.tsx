import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('não renderiza hamburger quando onMenuClick é omitido', () => {
    renderTopBar({ rightSlot: null });
    expect(screen.queryByRole('button', { name: /abrir menu/i })).not.toBeInTheDocument();
  });

  it('renderiza hamburger e dispara onMenuClick quando definido', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();
    renderTopBar({ rightSlot: null, onMenuClick });
    await user.click(screen.getByRole('button', { name: /abrir menu/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
