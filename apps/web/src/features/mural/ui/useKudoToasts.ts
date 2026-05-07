import { useEffect } from 'react';
import type { EventStream } from '../domain/ports';

export interface UseKudoToastsOptions {
  slug: string;
  token: string;
  myProfileId: string;
  stream: EventStream;
  /** Injetável para testes — em produção, sonner.toast.success. */
  notify: (message: string) => void;
}

/**
 * Assina o stream do evento e dispara um toast quando o usuário recebe um kudo.
 * Não exibe toast para kudos enviados a outros (esses já aparecem no mural).
 */
export function useKudoToasts({ slug, token, myProfileId, stream, notify }: UseKudoToastsOptions) {
  useEffect(() => {
    return stream.subscribe({ slug, token }, (e) => {
      if (e.type === 'kudo.created' && e.feedback.receiverId === myProfileId) {
        notify(`Você recebeu um kudo: "${e.feedback.content}"`);
      }
    });
  }, [slug, token, myProfileId, stream, notify]);
}
