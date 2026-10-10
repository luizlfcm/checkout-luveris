// GET /api/upgrade?p=apess&email=... — preço atual do upgrade para este e-mail (usado pelos apps e pela página de obrigado).
import { precoUpgrade } from './_lib/upgrade.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const p = String(req.query.p || ''); const email = String(req.query.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'e-mail inválido' });
  const r = await precoUpgrade(p, email).catch(() => null);
  if (!r) return res.status(404).json({ error: 'produto sem upgrade' });
  return res.status(200).json({ preco: r.preco, precoPromo: r.precoPromo, precoCheio: r.precoCheio, naJanela: r.naJanela, expiraEm: r.expiraEm });
}
