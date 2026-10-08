// Avisa o dashboard de vendas (Ads x Faturamento) das vendas/reembolsos do checkout próprio.
// Configuração (Vercel): DASHBOARD_URL (ex.: https://seu-dashboard.vercel.app) e
// DASHBOARD_WEBHOOK_SECRET (o mesmo valor de CHECKOUT_WEBHOOK_SECRET no dashboard).
// Em modo de teste só envia se DASHBOARD_ACEITA_TESTE=1 (para validar a integração; apague depois). Nunca envia em modo de teste (preço de teste ou Pix de teste) para não sujar o dashboard.
import { precoTeste } from './produtos.js';

export async function notificarDashboard(evento, orderId, reg, itens, extra = {}) {
  const base = String(process.env.DASHBOARD_URL || '').trim().replace(/\/$/, '');
  const segredo = process.env.DASHBOARD_WEBHOOK_SECRET;
  if (!base || !segredo) return { enviado: false, motivo: 'dashboard não configurado', semTentar: true };
  if ((precoTeste() || process.env.MP_MODO_TESTE === '1') && process.env.DASHBOARD_ACEITA_TESTE !== '1') return { enviado: false, motivo: 'modo de teste', semTentar: true };
  try {
    const r = await fetch(`${base}/api/webhooks/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-checkout-secret': segredo },
      body: JSON.stringify({
        evento, pedido: orderId, itens, email: reg.email, nome: reg.nome || '', metodo: reg.metodo || 'pix',
        data: new Date().toISOString(), recuperada: !!extra.recuperada,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error('dashboard: recusou', { evento, orderId, status: r.status, resp: (await r.text().catch(() => '')).slice(0, 200) });
    return { enviado: r.ok, status: r.status };
  } catch (e) {
    console.error('dashboard: falha', e?.message);
    return { enviado: false, motivo: String(e?.message || e) };
  }
}
