// Fórmula Exclusiva — pedidos feitos dentro do app (substitui o envio por WhatsApp).
//  POST /api/exclusiva                {produto:'fdl'|'ap', email, contato, itens:[{nome, descricao}]}  (cliente, sem senha; exige a Exclusiva liberada)
//  GET  /api/exclusiva?produto=&email=  -> pedidos do próprio cliente (status)
//  GET  /api/exclusiva                (header x-admin-key) -> todos os pedidos (painel /admin-exclusiva.html)
//  POST /api/exclusiva                (header x-admin-key) {acao:'status', id, status:'novo'|'andamento'|'entregue', nota?}
import { timingSafeEqual, randomBytes } from 'crypto';
import { cmd } from './_lib/redis.js';
import { PRODUTOS } from './_lib/produtos.js';
import { enviarAvisoAdmin } from './_lib/email.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_ITENS = 5;
const STATUS = ['novo', 'andamento', 'entregue'];
const PRODS = ['fdl', 'ap'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cortar = (s, n) => String(s == null ? '' : s).replace(/\u0000/g, '').trim().slice(0, n);

const chaveOk = (rec) => {
  const esp = process.env.ADMIN_KEY || '';
  if (!esp || !rec) return false;
  const a = Buffer.from(String(rec)), b = Buffer.from(esp);
  return a.length === b.length && timingSafeEqual(a, b);
};

const ORIGENS = ['fdl', 'ap', 'fdless', 'apess'].map((id) => { try { return new URL(PRODUTOS[id].appUrl).origin; } catch (e) { return ''; } }).filter(Boolean);

function contatoValido(c) {
  if (EMAIL_RE.test(c)) return true;
  const d = c.replace(/\D/g, '');
  return d.length >= 10 && d.length <= 13;
}

export default async function handler(req, res) {
  const origem = String(req.headers.origin || '');
  if (ORIGENS.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');

  try {
    const admin = chaveOk(req.headers['x-admin-key']);

    // ---------- GET ----------
    if (req.method === 'GET') {
      if (req.query.produto || req.query.email) {
        const produto = String(req.query.produto || '');
        const email = String(req.query.email || '').trim().toLowerCase();
        if (!PRODS.includes(produto) || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false });
        const ids = (await cmd(['LRANGE', `exc:cli:${produto}:${email}`, '0', '9'])) || [];
        const out = [];
        for (const id of ids) {
          const raw = await cmd(['GET', `exc:${id}`]);
          if (!raw) continue;
          const r = JSON.parse(raw);
          out.push({ id: r.id, criadoEm: r.criadoEm, status: r.status, itens: r.itens, contato: r.contato });
        }
        return res.status(200).json({ ok: true, pedidos: out });
      }
      if (!process.env.ADMIN_KEY) return res.status(503).json({ ok: false, error: 'ADMIN_KEY não configurada na Vercel (projeto do checkout).' });
      if (!admin) return res.status(401).json({ ok: false, error: 'Senha incorreta.' });
      const ids = (await cmd(['LRANGE', 'exc:idx', '0', '199'])) || [];
      const out = [];
      for (const id of ids) {
        const raw = await cmd(['GET', `exc:${id}`]);
        if (raw) out.push(JSON.parse(raw));
      }
      return res.status(200).json({ ok: true, pedidos: out });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // ---------- POST admin: mudar status ----------
    if (b.acao === 'status') {
      if (!admin) return res.status(401).json({ ok: false, error: 'Senha incorreta.' });
      const id = String(b.id || '');
      if (!/^[a-z0-9]{6,40}$/.test(id) || !STATUS.includes(b.status)) return res.status(400).json({ ok: false, error: 'Dados inválidos.' });
      const raw = await cmd(['GET', `exc:${id}`]);
      if (!raw) return res.status(404).json({ ok: false, error: 'Pedido não encontrado.' });
      const r = JSON.parse(raw);
      r.status = b.status;
      if (typeof b.nota === 'string') r.nota = cortar(b.nota, 1000);
      r.atualizadoEm = new Date().toISOString();
      await cmd(['SET', `exc:${id}`, JSON.stringify(r)]);
      return res.status(200).json({ ok: true, pedido: r });
    }

    // ---------- POST cliente: novo pedido ----------
    const produto = String(b.produto || '');
    const email = String(b.email || '').trim().toLowerCase();
    const contato = cortar(b.contato, 120);
    if (!PRODS.includes(produto)) return res.status(400).json({ ok: false, error: 'Produto inválido.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Entre no app com o e-mail da compra.' });
    if (!contatoValido(contato)) return res.status(400).json({ ok: false, error: 'Informe um WhatsApp (com DDD) ou um e-mail válido para a resposta.' });
    const itens = (Array.isArray(b.itens) ? b.itens : []).slice(0, MAX_ITENS)
      .map((i) => ({ nome: cortar(i && i.nome, 120), descricao: cortar(i && i.descricao, 1500), custo: cortar(i && i.custo, 30), qualidade: ['economica', 'intermediaria', 'premium'].includes(i && i.qualidade) ? i.qualidade : '' }))
      .filter((i) => i.nome);
    if (!itens.length) return res.status(400).json({ ok: false, error: 'Preencha ao menos a Fórmula 1.' });

    const p = PRODUTOS[produto];
    const raw = await cmd(['GET', `${p.redisPrefix}${email}`]);
    const cli = raw ? JSON.parse(raw) : null;
    if (!cli || !cli.form) return res.status(403).json({ ok: false, error: 'A Fórmula Exclusiva não está liberada para este e-mail.' });

    // Um pedido por compra: se já existe um que não foi entregue, o cliente edita em vez de criar outro.
    const lista = (await cmd(['LRANGE', `exc:cli:${produto}:${email}`, '0', '9'])) || [];
    if (lista.length >= 3) return res.status(429).json({ ok: false, error: 'Você já enviou pedidos demais. Aguarde o retorno do João.' });

    const id = Date.now().toString(36) + randomBytes(3).toString('hex');
    const reg = { id, produto, produtoNome: p.nome, email, nome: cli.nome || '', contato, itens, status: 'novo', criadoEm: new Date().toISOString() };
    await cmd(['SET', `exc:${id}`, JSON.stringify(reg)]);
    await cmd(['LPUSH', 'exc:idx', id]);
    await cmd(['LPUSH', `exc:cli:${produto}:${email}`, id]);

    // aviso ao dono (se EXCLUSIVA_AVISO_EMAIL estiver definido)
    const linhas = itens.map((i, n) => `<p><b>Fórmula ${n + 1}: ${esc(i.nome)}</b><br>${esc(i.descricao || '—').replace(/\n/g, '<br>')}${i.custo ? `<br><i>Custo esperado/litro: ${esc(i.custo)}</i>` : ''}${i.qualidade ? `<br><i>Qualidade: ${esc(i.qualidade)}</i>` : ''}</p>`).join('');
    enviarAvisoAdmin(produto, `🧪 Novo pedido de Fórmula Exclusiva — ${p.nome}`,
      `<div style="font-family:Arial,sans-serif;font-size:15px"><h2>Novo pedido de Fórmula Exclusiva</h2><p>Produto: <b>${esc(p.nome)}</b><br>Cliente: ${esc(cli.nome || '')} (${esc(email)})<br>Resposta em: <b>${esc(contato)}</b></p>${linhas}<p>Veja no painel: <a href="https://pagamento.luverisgroup.com.br/admin-exclusiva.html">admin-exclusiva</a></p></div>`,
      `Novo pedido de Fórmula Exclusiva (${p.nome}) de ${email}. Resposta em: ${contato}`).catch(() => {});

    return res.status(200).json({ ok: true, id });
  } catch (e) {
    console.error('exclusiva', e && e.message);
    return res.status(500).json({ ok: false, error: 'Erro ao processar. Tente de novo.' });
  }
}
