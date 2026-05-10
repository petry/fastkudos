import { describe, expect, it, vi } from 'vitest';
import { ApiError, createHttpClient } from './http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

function makeFetchMock(responder: (url: string, init?: RequestInit) => Promise<Response>) {
  return vi.fn(responder) as unknown as typeof fetch & {
    mock: { calls: Array<[string, RequestInit | undefined]> };
  };
}

describe('createHttpClient', () => {
  describe('GET', () => {
    it('injeta Authorization quando token é fornecido', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(200, { ok: true }));
      const client = createHttpClient('http://api', fetchImpl);
      await client.get('/inbox', { token: 'abc' });

      expect(fetchImpl).toHaveBeenCalledWith(
        'http://api/inbox',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ authorization: 'Bearer abc' }),
        }),
      );
    });

    it('omite Authorization quando token é undefined', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(200, {}));
      const client = createHttpClient('http://api', fetchImpl);
      await client.get('/health');

      const headers = fetchImpl.mock.calls[0]![1]!.headers as Record<string, string>;
      expect(headers).not.toHaveProperty('authorization');
    });

    it('parseia JSON da resposta', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(200, { items: [1, 2] }));
      const client = createHttpClient('http://api', fetchImpl);
      const data = await client.get<{ items: number[] }>('/x');
      expect(data).toEqual({ items: [1, 2] });
    });
  });

  describe('POST', () => {
    it('serializa body como JSON e injeta content-type', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(201, { id: 'x' }));
      const client = createHttpClient('http://api', fetchImpl);
      await client.post('/kudos', { token: 't', body: { receiverId: 'r', content: 'oi' } });

      const init = fetchImpl.mock.calls[0]![1]!;
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ receiverId: 'r', content: 'oi' }));
      expect(init.headers).toEqual(
        expect.objectContaining({
          authorization: 'Bearer t',
          'content-type': 'application/json',
        }),
      );
    });

    it('aceita POST sem body', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(200, {}));
      const client = createHttpClient('http://api', fetchImpl);
      await client.post('/x', { token: 't' });
      const init = fetchImpl.mock.calls[0]![1]!;
      expect(init.body).toBeUndefined();
    });
  });

  describe('PATCH', () => {
    it('envia body JSON com método PATCH', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(200, { name: 'novo' }));
      const client = createHttpClient('http://api', fetchImpl);
      await client.patch('/me/events/123', { token: 't', body: { name: 'novo' } });
      const init = fetchImpl.mock.calls[0]![1]!;
      expect(init.method).toBe('PATCH');
    });
  });

  describe('DELETE', () => {
    it('resolve sem retorno quando 204 No Content', async () => {
      const fetchImpl = makeFetchMock(async () => emptyResponse(204));
      const client = createHttpClient('http://api', fetchImpl);
      await expect(client.delete('/me/events/123', { token: 't' })).resolves.toBeUndefined();
    });
  });

  describe('erros', () => {
    it('lança ApiError com code do body em respostas 4xx', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(409, { error: 'slug_taken' }));
      const client = createHttpClient('http://api', fetchImpl);
      await expect(client.post('/me/events', { token: 't', body: {} })).rejects.toMatchObject({
        status: 409,
        code: 'slug_taken',
        message: 'slug_taken',
      });
    });

    it('ApiError é instância de Error (preserva toThrow nos testes de UI)', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(403, { error: 'forbidden' }));
      const client = createHttpClient('http://api', fetchImpl);
      await expect(client.get('/x', { token: 't' })).rejects.toBeInstanceOf(Error);
      await expect(client.get('/x', { token: 't' })).rejects.toBeInstanceOf(ApiError);
    });

    it('usa fallback http_<status> quando body não tem error', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(500, {}));
      const client = createHttpClient('http://api', fetchImpl);
      await expect(client.get('/x')).rejects.toMatchObject({ status: 500, code: 'http_500' });
    });

    it('usa fallback quando body não é JSON', async () => {
      const fetchImpl = makeFetchMock(async () => new Response('Bad Gateway', { status: 502 }));
      const client = createHttpClient('http://api', fetchImpl);
      await expect(client.get('/x')).rejects.toMatchObject({ status: 502, code: 'http_502' });
    });
  });

  describe('baseUrl', () => {
    it('respeita baseUrl com path absoluto', async () => {
      const fetchImpl = makeFetchMock(async () => jsonResponse(200, {}));
      const client = createHttpClient('http://api/v1', fetchImpl);
      await client.get('/health');
      expect(fetchImpl.mock.calls[0]![0]).toBe('http://api/v1/health');
    });
  });
});
