import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { KudoCard } from './KudoCard';

const ana: Profile = { id: 's', displayName: 'Ana', eventId: 'e', isAdmin: false, avatarUrl: null };
const bruno: Profile = { id: 'r', displayName: 'Bruno', eventId: 'e', isAdmin: false, avatarUrl: null };

const fb: Feedback = {
  id: 'f1',
  createdAt: new Date().toISOString(),
  senderId: 's',
  receiverId: 'r',
  eventId: 'e',
  content: 'Mandou super bem na apresentação!',
};

const profiles = new Map<string, Profile>([
  [ana.id, ana],
  [bruno.id, bruno],
]);

describe('<KudoCard>', () => {
  it('variant mural mostra sender e receiver', () => {
    render(<KudoCard variant="mural" feedback={fb} profilesById={profiles} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText(/mandou super bem/i)).toBeInTheDocument();
  });

  it('variant inbox mostra apenas o sender', () => {
    render(<KudoCard variant="inbox" feedback={fb} profilesById={profiles} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Bruno')).not.toBeInTheDocument();
    expect(screen.getByText(/de/i)).toBeInTheDocument();
  });

  it('mostra chip "você enviou" quando o sender é o usuário atual', () => {
    render(
      <KudoCard variant="mural" feedback={fb} profilesById={profiles} currentProfileId="s" />,
    );
    expect(screen.getByText(/você enviou/i)).toBeInTheDocument();
  });

  it('faz fallback para "Alguém" quando o profile não está no map', () => {
    render(<KudoCard variant="mural" feedback={fb} profilesById={new Map()} />);
    expect(screen.getAllByText(/alguém/i).length).toBeGreaterThan(0);
  });

  it('renderiza um <time> com createdAt', () => {
    const { container } = render(
      <KudoCard variant="mural" feedback={fb} profilesById={profiles} />,
    );
    const time = container.querySelector('time');
    expect(time).not.toBeNull();
    expect(time?.getAttribute('dateTime')).toBe(fb.createdAt);
  });
});
