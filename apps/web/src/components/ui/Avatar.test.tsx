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
});
