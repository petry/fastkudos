import { useState } from 'react';
import { Send } from 'lucide-react';
import { KUDO_MAX_LENGTH } from '@fastkudos/shared';
import { validateKudoContent } from '../domain/validate';
import type { KudosGateway } from '../domain/ports';
import { Avatar } from '../../../components/ui/Avatar';

export interface SendKudoFormProps {
  receiver: { id: string; displayName: string; avatarUrl?: string | null };
  token: string;
  gateway: KudosGateway;
  onSent?: () => void;
  onCancel?: () => void;
}

export function SendKudoForm({ receiver, token, gateway, onSent, onCancel }: SendKudoFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validateKudoContent(content);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    setSubmitting(true);
    try {
      await gateway.submit({ token, receiverId: receiver.id, content: v.value });
      setContent('');
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = KUDO_MAX_LENGTH - content.length;
  const counterClass =
    remaining < 0
      ? 'text-red-600'
      : remaining < 40
        ? 'text-amber-600'
        : 'text-slate-400';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
      aria-label={`Enviar kudo para ${receiver.displayName}`}
    >
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <Avatar name={receiver.displayName} imageUrl={receiver.avatarUrl} size="md" />
        <span>
          Para <strong className="font-semibold text-slate-900">{receiver.displayName}</strong>
        </span>
      </div>
      <textarea
        aria-label="Mensagem"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={KUDO_MAX_LENGTH + 50}
        required
        placeholder="Diga algo legal…"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${counterClass}`}>
          {content.length} / {KUDO_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-sky-600 hover:to-rose-600 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {submitting ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
