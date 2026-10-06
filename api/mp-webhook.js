// Webhook do Mercado Pago (evento "Order"). Valida assinatura, reconsulta o pedido
// na API do MP e libera/remove acesso. Sempre idempotente.
import { assinaturaOk } from './_lib/mp.js';
import { processarPedido } from './_lib/pedido.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!process.env.MP_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook desligado: configure MP_WEBHOOK_SECRET.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const dataId = req.query['data.id'] || body?.data?.id || '';
  if (!assinaturaOk(req, dataId)) return res.status(401).json({ error: 'Assinatura inválida' });
  if (!dataId) return res.status(200).json({ ok: true, ignored: true });

  try {
    const r = await processarPedido(dataId);
    return res.status(200).json({ ok: true, ...r });
  } catch (e) {
    console.error('mp-webhook', e);
    return res.status(500).json({ ok: false }); // MP tenta de novo
  }
}
