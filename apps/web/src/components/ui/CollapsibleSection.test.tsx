import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Users } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

describe('<CollapsibleSection>', () => {
  it('exibe o conteúdo por padrão (expandido)', () => {
    render(
      <CollapsibleSection title="Participantes" icon={Users}>
        <p>Conteúdo</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /participantes/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('esconde o conteúdo após clicar e exibe novamente após segundo clique', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Mural do evento" icon={Users}>
        <p>Conteúdo</p>
      </CollapsibleSection>,
    );
    const trigger = screen.getByRole('button', { name: /mural do evento/i });

    await user.click(trigger);
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('mantém título e contador visíveis quando recolhido', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Participantes" icon={Users} count={5}>
        <p>Conteúdo</p>
      </CollapsibleSection>,
    );
    await user.click(screen.getByRole('button', { name: /participantes/i }));
    expect(screen.getByText('Participantes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
