// Cria o pedido no Mercado Pago (Pix ou cartão) e registra o que foi comprado.
import { randomUUID } from 'crypto';
import { calcular } from './_lib/produtos.js';
import { mpFetch, cpfValido, mensagemRecusa } from './_lib/mp.js';
import { salvarRegistro, processarPedido, statusSimples } from './_lib/pedido.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!process.env.MP_ACCESS_TOKEN || !process.env.KV_REST_API_URL) {
    return res.status(500).json({ error: 'Checkout não configurado.' });
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  const calc = calcular(String(b.produto || ''), Array.isArray(b.bumps) ? b.bumps : [], b.saida === true);
  if (!calc) return res.status(400).json({ error: 'Produto inválido.' });

  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'Confira o e-mail digitado.' });
  const nome = String(b.nome || '').trim().slice(0, 80);

  const metodo = b.metodo === 'card' ? 'card' : 'pix';
  const orderBody = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: calc.valor,
    external_reference: `${b.produto}_${Date.now()}`,
    payer: { email },
    transactions: { payments: [] },
  };

  if (metodo === 'pix') {
    // Só para testes: com MP_MODO_TESTE=1 o Mercado Pago aprova o Pix sozinho (first_name APRO).
    if (process.env.MP_MODO_TESTE === '1') orderBody.payer.first_name = 'APRO';
    orderBody.transactions.payments.push({
      amount: calc.valor,
      payment_method: { id: 'pix', type: 'bank_transfer' },
      expiration_time: 'PT2H',
    });
  } else {
    const c = b.card || {};
    if (!c.token || !c.payment_method_id) return res.status(400).json({ error: 'Dados do cartão incompletos.' });
    const cpf = String(c.cpf || '').replace(/\D/g, '');
    if (!cpfValido(cpf)) return res.status(400).json({ error: 'CPF inválido. Confira os números.' });
    orderBody.payer.identification = { type: 'CPF', number: cpf };
    if (c.nome) orderBody.payer.first_name = String(c.nome).slice(0, 60);
    orderBody.transactions.payments.push({
      amount: calc.valor,
      payment_method: { id: String(c.payment_method_id), type: 'credit_card', token: String(c.token), installments: 1 },
    });
  }

  const { ok, status: http, data } = await mpFetch('/v1/orders', { method: 'POST', body: orderBody, idem: randomUUID() });
  if (!data?.id) {
    console.error('MP create order falhou', http, JSON.stringify(data));
    const detalhe = JSON.stringify(data?.errors || data?.message || '');
    return res.status(400).json({ error: metodo === 'card' ? mensagemRecusa(detalhe) : 'Não foi possível gerar o Pix. Tente novamente.' });
  }

  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  await salvarRegistro(data.id, {
    produto: String(b.produto), email, nome, flags: calc.flags, bumps: calc.bumps, valor: calc.valor, metodo, desconto: calc.saida ? 'saida10' : '',
    fbp: b.fbp || '', fbc: b.fbc || '', ip: fwd, ua: String(req.headers['user-agent'] || '').slice(0, 250),
    url: String(req.headers.referer || '').slice(0, 250),
    criadoEm: new Date().toISOString(),
  });

  const pay = data.transactions?.payments?.[0] || {};
  const st = statusSimples(data);

  if (metodo === 'card') {
    if (st === 'aprovado') {
      try { await processarPedido(data.id); } catch (e) { console.error('liberar cartão', e); }
      return res.status(200).json({ ok: true, id: data.id, status: 'aprovado' });
    }
    if (st === 'falhou' || ['rejected', 'failed'].includes(String(pay.status).toLowerCase())) {
      return res.status(402).json({ error: mensagemRecusa(pay.status_detail) });
    }
    return res.status(200).json({ ok: true, id: data.id, status: 'pendente' }); // em análise: o polling acompanha
  }

  const pm = pay.payment_method || {};
  return res.status(200).json({
    ok: true, id: data.id, status: 'pendente', valor: calc.valor,
    pix: { copiaECola: pm.qr_code || '', qrBase64: pm.qr_code_base64 || '', link: pm.ticket_url || '' },
  });
}
