import { ArrowRight } from 'lucide-react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { Avatar } from './Avatar';
import { formatRelativeTime } from './relative-time';

export type KudoCardVariant = 'mural' | 'inbox';

export interface KudoCardProps {
  variant: KudoCardVariant;
  feedback: Feedback;
  profilesById: Map<string, Profile>;
  currentProfileId?: string;
}

const ANON: Profile = {
  id: '',
  displayName: 'Alguém',
  eventId: '',
  isAdmin: false,
};

export function KudoCard({ variant, feedback, profilesById, currentProfileId }: KudoCardProps) {
  const sender = profilesById.get(feedback.senderId) ?? { ...ANON, id: feedback.senderId };
  const receiver = profilesById.get(feedback.receiverId) ?? { ...ANON, id: feedback.receiverId };
  const isOwn = currentProfileId !== undefined && feedback.senderId === currentProfileId;

  return (
    <li className="animate-fade-in-up rounded-2xl border border-slate-100 bg-white p-4 shadow-kudo">
      <header className="flex items-center gap-2 text-sm">
        {variant === 'mural' ? (
          <>
            <Avatar name={sender.displayName} size="sm" />
            <span className="font-semibold text-slate-800">{sender.displayName}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <Avatar name={receiver.displayName} size="sm" />
            <span className="font-semibold text-slate-800">{receiver.displayName}</span>
          </>
        ) : (
          <>
            <Avatar name={sender.displayName} size="sm" />
            <span className="text-slate-500">De</span>
            <span className="font-semibold text-slate-800">{sender.displayName}</span>
          </>
        )}
        {isOwn && (
          <span className="ml-auto rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
            você enviou
          </span>
        )}
      </header>
      <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-800">
        {feedback.content}
      </p>
      <time
        dateTime={feedback.createdAt}
        className="mt-3 block text-xs text-slate-400"
      >
        {formatRelativeTime(feedback.createdAt)}
      </time>
    </li>
  );
}
