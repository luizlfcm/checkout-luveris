// Processa um pedido do Mercado Pago: consulta a verdade na API do MP e
// libera/remove acesso no Upstash. Idempotente — webhook, polling e retorno do
// cartão podem chamar à vontade.
import { createHash } from 'crypto';
import { cmd, setFlag } from './redis.js';
import { mpFetch } from './mp.js';
import { PRODUTOS } from './produtos.js';
import { enviarEntrega, enviarReembolso } from './email.js';

const APROVADO = ['processed', 'accredited'];
const REEMBOLSO = ['refunded', 'charged_back', 'chargeback']; // reembolso parcial NÃO remove acesso

export const chaveRegistro = (id) => `chk_order:${id}`;

export async function salvarRegistro(id, reg) {
  await cmd(['SET', chaveRegistro(id), JSON.stringify(reg), 'EX', String(60 * 60 * 24 * 30)]);
}

export function statusSimples(order) {
  const s = String(order?.status || '').toLowerCase();
  const det = String(order?.transactions?.payments?.[0]?.status_detail || '').toLowerCase();
  if (APROVADO.includes(s) || det === 'accredited') return 'aprovado';
  if (REEMBOLSO.includes(s)) return 'reembolsado';
  if (['canceled', 'cancelled', 'expired', 'failed', 'rejected'].includes(s)) return 'falhou';
  return 'pendente';
}

async function capiPurchase(reg, id) {
  const pixel = process.env[`META_PIXEL_ID_${String(reg.produto).toUpperCase()}`] || process.env.META_PIXEL_ID;
  const tok = process.env.META_CAPI_TOKEN;
  if (!pixel || !tok) return;
  const sha = (v) => createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${id}`,
      action_source: 'website',
      event_source_url: reg.url || undefined,
      user_data: {
        em: [sha(reg.email)],
        fbp: reg.fbp || undefined,
        fbc: reg.fbc || undefined,
        client_ip_address: reg.ip || undefined,
        client_user_agent: reg.ua || undefined,
      },
      custom_data: { currency: 'BRL', value: Number(reg.valor), content_name: PRODUTOS[reg.produto]?.nome },
    }],
  };
  await fetch(`https://graph.facebook.com/v19.0/${pixel}/events?access_token=${encodeURIComponent(tok)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).catch(() => {});
}

export async function processarPedido(orderId) {
  const { ok, data: order } = await mpFetch(`/v1/orders/${encodeURIComponent(orderId)}`);
  if (!ok) throw new Error(`MP order ${orderId} indisponível`);
  const status = statusSimples(order);

  const raw = await cmd(['GET', chaveRegistro(orderId)]);
  if (!raw) return { status, ignorado: true }; // pedido que não é deste checkout
  const reg = JSON.parse(raw);
  const produto = PRODUTOS[reg.produto];
  if (!produto) return { status, ignorado: true };

  if (status === 'aprovado') {
    for (const flag of reg.flags) await setFlag(produto, reg.email, reg.nome, flag, true);
    const primeira = await cmd(['SET', `chk_paid:${orderId}`, '1', 'NX', 'EX', String(60 * 60 * 24 * 90)]);
    if (primeira) await capiPurchase(reg, orderId);
    // E-mail de entrega: uma única vez por pedido; se falhar, libera a trava para tentar de novo.
    const mailTrava = await cmd(['SET', `chk_mail:${orderId}`, '1', 'NX', 'EX', String(60 * 60 * 24 * 90)]);
    if (mailTrava) {
      try {
        const r = await enviarEntrega(reg);
        if (!r.enviado) await cmd(['DEL', `chk_mail:${orderId}`]);
      } catch (e) { console.error('email entrega', e); await cmd(['DEL', `chk_mail:${orderId}`]).catch(() => {}); }
    }
  } else if (status === 'reembolsado') {
    for (const flag of reg.flags) await setFlag(produto, reg.email, reg.nome, flag, false);
    const trava = await cmd(['SET', `chk_refmail:${orderId}`, '1', 'NX', 'EX', String(60 * 60 * 24 * 90)]);
    if (trava) {
      try {
        const r = await enviarReembolso(reg);
        if (!r.enviado) await cmd(['DEL', `chk_refmail:${orderId}`]);
      } catch (e) { console.error('email reembolso', e); await cmd(['DEL', `chk_refmail:${orderId}`]).catch(() => {}); }
    }
  }
  return { status, email: reg.email };
}
