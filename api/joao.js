// Joãozinho (assistente virtual dos apps e do Clube): registra as perguntas que ele NÃO soube responder,
// para você ver o que os alunos perguntam e ampliar as respostas.
//   POST /api/joao   body (text/plain com JSON): { q: 'pergunta', app: 'fdl'|'ap'|'fdless'|'apess'|'clube'|'pvfdl'|'pvap' (pv* = páginas de vendas) }
//   GET  /api/joao   (header x-admin-key = ADMIN_KEY)  -> as perguntas mais repetidas ( ?fmt=txt para texto simples )
// Não guarda e-mail, IP nem identificação: só o texto da pergunta (com e-mails e números longos mascarados) e o app.
import { timingSafeEqual } from 'crypto';
import { cmd } from './_lib/redis.js';
import { PRODUTOS } from './_lib/produtos.js';

const APPS = ['fdl', 'ap', 'fdless', 'apess', 'clube', 'pvfdl', 'pvap'];
const CHAVE = 'joao_sr';
const MAX = 1500;
const origemDe = (u) => { try { return new URL(u).origin; } catch (e) { return ''; } };
const ORIGENS = () => [...['fdl', 'ap', 'fdless', 'apess'].map((id) => origemDe(PRODUTOS[id].appUrl)), origemDe(process.env.COMUNIDADE_URL || 'https://clube.luverisgroup.com.br'), 'https://limpezaelucrativa.luverisgroup.com.br', 'https://formulaautopro.luverisgroup.com.br', ...String(process.env.PV_ORIGENS || '').split(/[\s,]+/).map(origemDe)].filter(Boolean);
const chaveOk = (rec) => {
  const esp = process.env.ADMIN_KEY || '';
  if (!esp || !rec) return false;
  const a = Buffer.from(String(rec)), b = Buffer.from(esp);
  return a.length === b.length && timingSafeEqual(a, b);
};
const limpa = (t) => String(t || '').normalize('NFC').replace(/[\u0000-\u001F\u007F]/g, ' ')
  .replace(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/g, '[email]').replace(/\d[\d\s().-]{7,}\d/g, '[numero]').replace(/\s+/g, ' ').trim().slice(0, 200);

export default async function handler(req, res) {
  const origem = String(req.headers.origin || '');
  const permitida = ORIGENS().includes(origem);
  if (permitida) { res.setHeader('Access-Control-Allow-Origin', origem); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); }
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      if (!chaveOk(req.headers['x-admin-key'])) return res.status(401).json({ error: 'Não autorizado.' });
      const r = await cmd(['ZREVRANGE', CHAVE, '0', '149', 'WITHSCORES']);
      const lista = [];
      for (let i = 0; i < (r || []).length; i += 2) { const [app, ...q] = String(r[i]).split('|'); lista.push({ vezes: Number(r[i + 1]), app, pergunta: q.join('|') }); }
      if (req.query?.fmt === 'txt') { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.status(200).send(lista.map((x) => `${x.vezes}x  [${x.app}]  ${x.pergunta}`).join('\n') || '(nenhuma pergunta sem resposta ainda)'); }
      return res.status(200).json({ total: lista.length, perguntas: lista });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    if (!permitida) return res.status(403).json({ error: 'Origem não permitida.' });

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    const app = String(b?.app || ''), q = limpa(b?.q);
    if (!APPS.includes(app) || q.length < 3) return res.status(204).end();

    // limite simples por visitante (sem guardar o IP): 30 registros por hora
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const rl = 'joao_rl:' + Buffer.from(ip).toString('base64').slice(0, 24);
    const n = await cmd(['INCR', rl]);
    if (n === 1) await cmd(['EXPIRE', rl, '3600']);
    if (n > 30) return res.status(204).end();

    await cmd(['ZINCRBY', CHAVE, '1', `${app}|${q.toLowerCase()}`]);
    const tam = await cmd(['ZCARD', CHAVE]);
    if (tam > MAX) await cmd(['ZREMRANGEBYRANK', CHAVE, '0', String(tam - MAX + 200 - 1)]);
    return res.status(204).end();
  } catch (e) {
    return res.status(204).end(); // nunca atrapalha o aluno
  }
}
