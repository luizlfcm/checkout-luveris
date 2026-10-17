// POST /api/reabrir-upgrade  (header x-admin-key = ADMIN_KEY)  body: { produto: 'fdless'|'apess', email, horas? }
// Reabre, para um cliente específico, o preço do upgrade com crédito (a janela de 72 h do Essencial já passou).
// O preço continua sendo decidido no servidor: o link é o mesmo de sempre (/<produto>/upg?email=...).
import { timingSafeEqual } from 'crypto';
import { cmd } from './_lib/redis.js';
import { PRODUTOS } from './_lib/produtos.js';
import { reabrirJanela, precoUpgrade } from './_lib/upgrade.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BASE = 'https://pagamento.luverisgroup.com.br';
const chaveOk = (rec) => {
  const esp = process.env.ADMIN_KEY || '';
  if (!esp || !rec) return false;
  const a = Buffer.from(String(rec)), b = Buffer.from(esp);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Os painéis admin dos apps Essencial (instaláveis no celular) chamam este endpoint de outro domínio.
const ORIGENS = ['fdl', 'ap', 'fdless', 'apess'].map((id) => { try { return new URL(PRODUTOS[id].appUrl).origin; } catch (e) { return ''; } }).filter(Boolean);

export default async function handler(req, res) {
  const origem = String(req.headers.origin || '');
  if (ORIGENS.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });
  if (!process.env.ADMIN_KEY) return res.status(503).json({ ok: false, error: 'ADMIN_KEY não configurada na Vercel (projeto do checkout).' });
  if (!chaveOk(req.headers['x-admin-key'])) return res.status(401).json({ ok: false, error: 'Senha incorreta.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const produto = String(body.produto || '');
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'E-mail inválido.' });
  const p = PRODUTOS[produto];
  if (!p?.upsell) return res.status(400).json({ ok: false, error: 'Produto sem upgrade (use fdless ou apess).' });

  try {
    // Só reabre para quem realmente tem o Essencial.
    const raw = await cmd(['GET', `${p.redisPrefix}${email}`]);
    const cli = raw ? JSON.parse(raw) : null;
    if (!cli?.base) return res.status(404).json({ ok: false, error: `Esse e-mail não tem o ${p.nome} liberado.` });
    if (cli.upg) return res.status(409).json({ ok: false, error: 'Esse cliente já fez o upgrade.' });

    const r = await reabrirJanela(produto, email, body.horas);
    const preco = await precoUpgrade(produto, email);
    const link = `${BASE}/${produto}/upg?email=${encodeURIComponent(email)}&utm_source=whatsapp&utm_medium=manual&utm_campaign=upg_reaberto`;
    return res.status(200).json({ ok: true, link, preco: preco.preco, expiraEm: r.expiraEm, nome: p.upsell.nome });
  } catch (e) {
    console.error('reabrir-upgrade', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro ao reabrir. Tente de novo.' });
  }
}
