import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Avatar } from './Avatar';
import { avatarColorFor } from './avatar-color';

describe('<Avatar>', () => {
  it('renderiza as iniciais do nome', () => {
    const { container } = render(<Avatar name="Ana Silva" />);
    expect(container.textContent).toBe('AS');
  });

  it('aplica a cor consistente para o mesmo nome', () => {
    const a = render(<Avatar name="Bruno" />);
    const b = render(<Avatar name="Bruno" />);
    const expected = avatarColorFor('Bruno').bg;
    expect(a.container.firstElementChild?.className).toContain(expected);
    expect(b.container.firstElementChild?.className).toContain(expected);
  });

  it('respeita o tamanho lg', () => {
    const { container } = render(<Avatar name="Bob" size="lg" />);
    expect(container.firstElementChild?.className).toMatch(/h-16|w-16/);
  });

  it('expõe o nome via aria-label', () => {
    const { getByLabelText } = render(<Avatar name="Ana" />);
    expect(getByLabelText('Ana')).toBeInTheDocument();
  });

  it('renderiza <img> quando recebe imageUrl, com alt = nome', () => {
    const { getByRole } = render(
      <Avatar name="Ana Silva" imageUrl="https://lh.googleusercontent.com/a/x.png" />,
    );
    const img = getByRole('img', { name: 'Ana Silva' });
    expect(img).toHaveAttribute('src', 'https://lh.googleusercontent.com/a/x.png');
  });

  it('faz fallback para iniciais quando imageUrl é nulo/undefined', () => {
    const { container } = render(<Avatar name="Ana Silva" imageUrl={null} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('AS');
  });

  it('não força referrerPolicy="no-referrer" (quebra em Safari/ITP)', () => {
    const { getByRole } = render(
      <Avatar name="Ana" imageUrl="https://lh.googleusercontent.com/a/x.png" />,
    );
    expect(getByRole('img')).not.toHaveAttribute('referrerpolicy', 'no-referrer');
  });
});
