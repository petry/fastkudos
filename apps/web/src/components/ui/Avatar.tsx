import { useState } from 'react';
import { avatarColorFor, initialsFor } from './avatar-color';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const tone = avatarColorFor(name);
  const sizeClass = SIZE_CLASSES[size];
  const showImage = !!imageUrl && !errored;
  const baseClass = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-sm ring-2 ${tone.ring} ${sizeClass} ${className}`.trim();

  if (showImage) {
    return (
      <span className={baseClass}>
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span aria-label={name} className={`${baseClass} ${tone.bg}`.trim()}>
      <span aria-hidden="true">{initialsFor(name)}</span>
    </span>
  );
}
