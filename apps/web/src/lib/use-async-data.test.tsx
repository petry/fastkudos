import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncData } from './use-async-data';

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsyncData', () => {
  it('inicia com data=null e error=null', () => {
    const loader = vi.fn(() => new Promise(() => {})) as () => Promise<unknown>;
    const { result } = renderHook(() => useAsyncData(loader, []));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('armazena data quando loader resolve', async () => {
    const { result } = renderHook(() => useAsyncData(async () => [1, 2, 3], []));
    await waitFor(() => expect(result.current.data).toEqual([1, 2, 3]));
    expect(result.current.error).toBeNull();
  });

  it('armazena error.message quando loader rejeita', async () => {
    const { result } = renderHook(() =>
      useAsyncData(async () => {
        throw new Error('boom');
      }, []),
    );
    await waitFor(() => expect(result.current.error).toBe('boom'));
    expect(result.current.data).toBeNull();
  });

  it('mensagem genérica quando loader rejeita com não-Error', async () => {
    const { result } = renderHook(() =>
      useAsyncData(async () => {
        throw 'string-thrown';
      }, []),
    );
    await waitFor(() => expect(result.current.error).toBe('erro'));
  });

  it('refetch quando deps mudam', async () => {
    const loader = vi.fn(async (n: number) => n * 10);
    const { result, rerender } = renderHook(
      ({ n }) => useAsyncData(() => loader(n), [n]),
      { initialProps: { n: 1 } },
    );
    await waitFor(() => expect(result.current.data).toBe(10));

    rerender({ n: 2 });
    await waitFor(() => expect(result.current.data).toBe(20));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('não chama setState após unmount', async () => {
    const { promise, resolve } = deferred<number>();
    const { unmount, result } = renderHook(() => useAsyncData(() => promise, []));
    unmount();
    resolve(42);
    await promise;
    // Sem warning de "set state on unmounted"; data permanece null no último snapshot.
    expect(result.current.data).toBeNull();
  });

  it('ignora resultado de loader anterior quando deps mudam no meio', async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    let firstCall = true;
    const loader = () => {
      if (firstCall) {
        firstCall = false;
        return slow.promise;
      }
      return fast.promise;
    };

    const { result, rerender } = renderHook(
      ({ k }) => useAsyncData(loader, [k]),
      { initialProps: { k: 'a' } },
    );
    rerender({ k: 'b' });
    fast.resolve('B');
    await waitFor(() => expect(result.current.data).toBe('B'));

    slow.resolve('A');
    await slow.promise;
    // O resultado do loader anterior foi descartado.
    expect(result.current.data).toBe('B');
  });

  it('expõe setData para mutações externas', async () => {
    const { result } = renderHook(() => useAsyncData(async () => [1, 2], []));
    await waitFor(() => expect(result.current.data).toEqual([1, 2]));

    act(() => result.current.setData((prev) => (prev ? [...prev, 3] : prev)));
    expect(result.current.data).toEqual([1, 2, 3]);
  });

  it('limpa erro anterior em refetch bem-sucedido', async () => {
    let shouldFail = true;
    const { result, rerender } = renderHook(
      ({ k }) =>
        useAsyncData(
          async () => {
            if (shouldFail) throw new Error('first_fail');
            return 'ok';
          },
          [k],
        ),
      { initialProps: { k: 'a' } },
    );
    await waitFor(() => expect(result.current.error).toBe('first_fail'));

    shouldFail = false;
    rerender({ k: 'b' });
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeNull();
  });
});
