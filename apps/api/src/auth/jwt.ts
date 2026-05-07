// JWT HS256 mínimo, sem dependências, compatível com Workers (WebCrypto).
// Claims usados: sub, event_id, display_name, is_admin, exp, iat.

export interface JwtClaims {
  sub: string;
  event_id: string;
  display_name: string;
  is_admin: boolean;
  exp: number;
  iat: number;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signJwt(claims: Omit<JwtClaims, 'iat' | 'exp'>, secret: string, ttlSeconds: number): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = { ...claims, iat, exp: iat + ttlSeconds };
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerPart = b64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadPart = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret);
  const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(signingInput)));
  return `${signingInput}.${b64urlEncode(sigBytes)}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('jwt malformado');
  const [headerPart, payloadPart, sigPart] = parts as [string, string, string];
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    b64urlDecode(sigPart),
    enc.encode(`${headerPart}.${payloadPart}`),
  );
  if (!ok) throw new Error('jwt inválido');
  const claims = JSON.parse(dec.decode(b64urlDecode(payloadPart))) as JwtClaims;
  if (claims.exp * 1000 < Date.now()) throw new Error('jwt expirado');
  return claims;
}
