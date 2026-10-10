// Cria o pedido no Mercado Pago (Pix ou cartão) e registra o que foi comprado.
import { randomUUID } from 'crypto';
import { calcular } from './_lib/produtos.js';
import { mpFetch, cpfValido, mensagemRecusa } from './_lib/mp.js';
import { salvarRegistro, processarPedido, statusSimples, statusDetalhado, registrarStatus } from './_lib/pedido.js';
import { agendarRecuperacao } from './_lib/recuperacao.js';
import { precoUpgrade } from './_lib/upgrade.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!process.env.MP_ACCESS_TOKEN || !process.env.KV_REST_API_URL) {
    return res.status(500).json({ error: 'Checkout não configurado.' });
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  let calc = calcular(String(b.produto || ''), Array.isArray(b.bumps) ? b.bumps : [], b.saida === true, String(b.avulso || ''));
  if (!calc) return res.status(400).json({ error: 'Produto inválido.' });

  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'Confira o e-mail digitado.' });
  // Upgrade com janela: o preço depende de quando o e-mail comprou o Essencial (decidido aqui, nunca pelo navegador).
  if (calc.avulso?.janelaH) {
    const pu = await precoUpgrade(String(b.produto), email);
    calc = calcular(String(b.produto), [], false, String(b.avulso), pu.preco);
  }
  // Nome: o digitado no passo 1; se vazio, o do cartão. Limpo e com iniciais maiúsculas.
  const nomeBruto = String(b.nome || (b.card && b.card.nome) || '').replace(/[^\p{L}\s'.-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const nome = nomeBruto.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, c) => a + c.toUpperCase());

  const metodo = b.metodo === 'card' ? 'card' : 'pix';
  let parcelas = 1;
  const orderBody = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: calc.valor,
    external_reference: `${b.produto}_${Date.now()}`,
    description: calc.itens.map((i) => i.nome).join(' + ').slice(0, 140),
    payer: { email, ...(nome ? { first_name: nome.split(' ')[0], ...(nome.includes(' ') ? { last_name: nome.split(' ').slice(1).join(' ') } : {}) } : {}) },
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
    const MAXP = Math.max(1, Math.min(12, parseInt(process.env.MAX_PARCELAS || '3', 10) || 3));
    parcelas = Math.max(1, Math.min(MAXP, parseInt(c.installments, 10) || 1));
    const cpf = String(c.cpf || '').replace(/\D/g, '');
    if (!cpfValido(cpf)) return res.status(400).json({ error: 'CPF inválido. Confira os números.' });
    orderBody.payer.identification = { type: 'CPF', number: cpf };
    orderBody.transactions.payments.push({
      amount: calc.valor,
      payment_method: { id: String(c.payment_method_id), type: 'credit_card', token: String(c.token), installments: parcelas },
    });
  }

  const { ok, status: http, data } = await mpFetch('/v1/orders', { method: 'POST', body: orderBody, idem: randomUUID() });
  if (!data?.id) {
    console.error('MP create order falhou', http, JSON.stringify(data));
    const detalhe = JSON.stringify(data?.errors || data?.message || '');
    return res.status(400).json({ error: metodo === 'card' ? mensagemRecusa(detalhe) : 'Não foi possível gerar o Pix. Tente novamente.' });
  }

  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const reg = {
    produto: String(b.produto), avulso: calc.avulso ? calc.avulso.id : '', email, nome, flags: calc.flags, bumps: calc.bumps, itens: calc.itens, valor: calc.valor, metodo, parcelas, desconto: calc.saida ? 'saida10' : '',
    fbp: b.fbp || '', fbc: b.fbc || '', ip: fwd, ua: String(req.headers['user-agent'] || '').slice(0, 250),
    url: String(req.headers.referer || '').slice(0, 250),
    criadoEm: new Date().toISOString(),
  };
  await salvarRegistro(data.id, reg);

  const pay = data.transactions?.payments?.[0] || {};
  const st = statusSimples(data);
  await registrarStatus(data.id, reg, statusDetalhado(data), pay.status_detail); // aba "Checkout" do dashboard

  if (metodo === 'card') {
    if (st === 'aprovado') {
      try { await processarPedido(data.id); } catch (e) { console.error('liberar cartão', e); }
      return res.status(200).json({ ok: true, id: data.id, status: 'aprovado' });
    }
    if (st === 'falhou' || ['rejected', 'failed'].includes(String(pay.status).toLowerCase())) {
      if (!reg.avulso) await agendarRecuperacao(reg, 'cartao'); // só age se RECUPERACAO=1 (não vale para links avulsos)
      return res.status(402).json({ error: mensagemRecusa(pay.status_detail) });
    }
    return res.status(200).json({ ok: true, id: data.id, status: 'pendente' }); // em análise: o polling acompanha
  }

  const pm = pay.payment_method || {};
  if (!reg.avulso) await agendarRecuperacao(reg, 'pix', pm.qr_code || ''); // só age se RECUPERACAO=1 (não vale para links avulsos)
  return res.status(200).json({
    ok: true, id: data.id, status: 'pendente', valor: calc.valor,
    pix: { copiaECola: pm.qr_code || '', qrBase64: pm.qr_code_base64 || '', link: pm.ticket_url || '' },
  });
}
