export interface AvatarTone {
  tone: string;
  bg: string;
  ring: string;
}

export const AVATAR_PALETTE: readonly AvatarTone[] = [
  { tone: 'sky', bg: 'bg-sky-500', ring: 'ring-sky-200' },
  { tone: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-200' },
  { tone: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-200' },
  { tone: 'fuchsia', bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-200' },
  { tone: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-200' },
  { tone: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-200' },
  { tone: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-200' },
  { tone: 'teal', bg: 'bg-teal-500', ring: 'ring-teal-200' },
] as const;

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarColorFor(name: string): AvatarTone {
  const idx = hash(name) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx]!;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  const second = parts[1];
  if (!second) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}
