import { avatarColorFor, initialsFor } from './avatar-color';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const tone = avatarColorFor(name);
  const initials = initialsFor(name);
  const sizeClass = SIZE_CLASSES[size];
  return (
    <span
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ring-2 ${tone.bg} ${tone.ring} ${sizeClass} ${className}`.trim()}
    >
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}
