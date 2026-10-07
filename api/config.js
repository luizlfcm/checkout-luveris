// Dados públicos que o navegador precisa (Public Key NÃO é segredo).
import { PRODUTOS } from './_lib/produtos.js';

export default function handler(req, res) {
  const id = String(req.query.p || '');
  const p = PRODUTOS[id];
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    publicKey: process.env.MP_PUBLIC_KEY || '',
    pixelId: process.env[`META_PIXEL_ID_${id.toUpperCase()}`] || process.env.META_PIXEL_ID || '',
    produto: { id, nome: p.nome, preco: p.preco, appUrl: p.appUrl, imagem: p.imagem || '', bumps: p.bumps.map(({ id, nome, desc, preco, de, imagem }) => ({ id, nome, desc, preco, de: de || 0, imagem: imagem || '' })) },
  });
}
