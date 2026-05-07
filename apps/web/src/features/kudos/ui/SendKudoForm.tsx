import { useState } from 'react';
import { validateKudoContent } from '../domain/validate';
import type { KudosGateway } from '../domain/ports';

export interface SendKudoFormProps {
  receiver: { id: string; displayName: string };
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

  return (
    <form onSubmit={handleSubmit} className="space-y-2" aria-label={`Enviar kudo para ${receiver.displayName}`}>
      <p className="text-sm text-slate-600">Para <strong>{receiver.displayName}</strong></p>
      <textarea
        aria-label="Mensagem"
        className="w-full rounded border border-slate-300 px-3 py-2"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Enviando…' : 'Enviar'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
