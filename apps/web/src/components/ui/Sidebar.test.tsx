import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Sidebar, type SidebarItem } from './Sidebar';

const items: SidebarItem[] = [
  { to: '/e/demo', label: 'Mural', icon: Sparkles, end: true },
  { to: '/e/demo/inbox', label: 'Caixa de recados', icon: MessageCircle },
];

interface RenderOpts {
  initial?: string;
  expanded?: boolean;
  mobileOpen?: boolean;
  footer?: React.ReactNode;
  onMobileClose?: () => void;
}

function renderSidebar({
  initial = '/e/demo',
  expanded = true,
  mobileOpen = false,
  footer,
  onMobileClose = () => {},
}: RenderOpts = {}) {
  return render(
    <MemoryRouter
      initialEntries={[initial]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Sidebar
        items={items}
        expanded={expanded}
        mobileOpen={mobileOpen}
        onMobileClose={onMobileClose}
        footer={footer}
      />
    </MemoryRouter>,
  );
}

describe('<Sidebar>', () => {
  it('renderiza um link para cada item', () => {
    renderSidebar();
    const mural = screen.getByRole('link', { name: /mural/i });
    const inbox = screen.getByRole('link', { name: /caixa de recados/i });
    expect(mural).toHaveAttribute('href', '/e/demo');
    expect(inbox).toHaveAttribute('href', '/e/demo/inbox');
  });

  it('marca o item ativo via aria-current=page com base na rota', () => {
    renderSidebar({ initial: '/e/demo/inbox' });
    expect(screen.getByRole('link', { name: /caixa de recados/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /mural/i })).not.toHaveAttribute('aria-current');
  });

  it('respeita end=true: /e/demo/inbox não ativa Mural', () => {
    renderSidebar({ initial: '/e/demo/inbox' });
    expect(screen.getByRole('link', { name: /mural/i })).not.toHaveAttribute('aria-current');
  });

  it('renderiza o footer passado', () => {
    renderSidebar({ footer: <span data-testid="footer">rodapé</span> });
    expect(screen.getByTestId('footer')).toHaveTextContent('rodapé');
  });

  it('clicar em item dispara onMobileClose (fecha drawer)', async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });
    await user.click(screen.getByRole('link', { name: /caixa de recados/i }));
    expect(onMobileClose).toHaveBeenCalled();
  });

  it('clicar no botão fechar (mobile) dispara onMobileClose', async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });
    await user.click(screen.getByRole('button', { name: /fechar menu/i }));
    expect(onMobileClose).toHaveBeenCalled();
  });
});
