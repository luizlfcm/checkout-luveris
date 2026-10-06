// Mercado Pago — API de Orders (Checkout Transparente)
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';

const BASE = 'https://api.mercadopago.com';

export async function mpFetch(path, { method = 'GET', body, idem } = {}) {
  const headers = {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') headers['X-Idempotency-Key'] = idem || randomUUID();
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

// Valida a assinatura x-signature do webhook (HMAC-SHA256 do manifest).
export function assinaturaOk(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const sig = req.headers['x-signature'];
  if (!secret || !sig) return false;
  const parts = Object.fromEntries(String(sig).split(',').map((p) => p.trim().split('=')));
  if (!parts.ts || !parts.v1) return false;
  const reqId = req.headers['x-request-id'];
  let manifest = '';
  if (dataId) manifest += `id:${String(dataId).toLowerCase()};`;
  if (reqId) manifest += `request-id:${reqId};`;
  manifest += `ts:${parts.ts};`;
  const calc = createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(calc), b = Buffer.from(String(parts.v1));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function cpfValido(cpf) {
  const s = String(cpf || '').replace(/\D/g, '');
  if (s.length !== 11 || /^(\d)\1+$/.test(s)) return false;
  const dig = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(s[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(s[9]) && dig(10) === Number(s[10]);
}

// Mensagens simples para o cliente quando o cartão é recusado
export function mensagemRecusa(detail = '') {
  const d = String(detail).toLowerCase();
  if (d.includes('insufficient')) return 'Saldo/limite insuficiente. Tente outro cartão ou pague com Pix.';
  if (d.includes('security_code') || d.includes('cvv')) return 'Código de segurança incorreto. Confira o número atrás do cartão.';
  if (d.includes('expiration') || d.includes('expired')) return 'Validade do cartão incorreta. Confira e tente de novo.';
  if (d.includes('card_number') || d.includes('invalid')) return 'Dados do cartão incorretos. Confira e tente de novo.';
  if (d.includes('high_risk') || d.includes('fraud')) return 'O pagamento não foi autorizado. Tente pagar com Pix.';
  return 'O cartão foi recusado. Tente outro cartão ou pague com Pix.';
}
