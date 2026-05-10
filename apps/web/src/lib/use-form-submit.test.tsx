import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFormSubmit } from './use-form-submit';

describe('useFormSubmit', () => {
  it('inicia com submitting=false e error=null', () => {
    const { result } = renderHook(() => useFormSubmit());
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('marca submitting=true durante a op e false depois', async () => {
    const { result } = renderHook(() => useFormSubmit());
    let resolveOp!: (v: number) => void;
    const op = new Promise<number>((res) => {
      resolveOp = res;
    });

    let runPromise!: Promise<number | undefined>;
    act(() => {
      runPromise = result.current.run(() => op);
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));

    resolveOp(42);
    const value = await runPromise;
    expect(value).toBe(42);
    await waitFor(() => expect(result.current.submitting).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('captura Error.message e retorna undefined', async () => {
    const { result } = renderHook(() => useFormSubmit());
    let value: number | undefined;
    await act(async () => {
      value = await result.current.run(async () => {
        throw new Error('boom');
      });
    });
    expect(value).toBeUndefined();
    expect(result.current.error).toBe('boom');
    expect(result.current.submitting).toBe(false);
  });

  it('mensagem genérica para throw não-Error', async () => {
    const { result } = renderHook(() => useFormSubmit());
    await act(async () => {
      await result.current.run(async () => {
        throw 'string-thrown';
      });
    });
    expect(result.current.error).toBe('erro');
  });

  it('limpa erro anterior em nova chamada de run', async () => {
    const { result } = renderHook(() => useFormSubmit());
    await act(async () => {
      await result.current.run(async () => {
        throw new Error('first');
      });
    });
    expect(result.current.error).toBe('first');

    await act(async () => {
      await result.current.run(async () => 'ok');
    });
    expect(result.current.error).toBeNull();
  });

  it('expõe setError para validações client-side', () => {
    const { result } = renderHook(() => useFormSubmit());
    act(() => result.current.setError('slug inválido'));
    expect(result.current.error).toBe('slug inválido');

    act(() => result.current.setError(null));
    expect(result.current.error).toBeNull();
  });

  it('mantém submitting=false se op é síncrona e lança imediatamente', async () => {
    const { result } = renderHook(() => useFormSubmit());
    await act(async () => {
      await result.current.run(() => {
        throw new Error('sync_boom');
      });
    });
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBe('sync_boom');
  });
});
