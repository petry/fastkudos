import { useCallback, useState } from 'react';

export interface UseFormSubmitResult {
  submitting: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  /**
   * Executa op com setSubmitting(true), try/catch e setSubmitting(false).
   * Limpa o erro antes de rodar; em falha, captura a mensagem e retorna undefined.
   */
  run: <T>(op: () => Promise<T> | T) => Promise<T | undefined>;
}

export function useFormSubmit(): UseFormSubmitResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(op: () => Promise<T> | T): Promise<T | undefined> => {
    setError(null);
    setSubmitting(true);
    try {
      return await op();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, error, setError, run };
}
