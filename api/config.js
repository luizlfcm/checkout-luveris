// Dados públicos que o navegador precisa (Public Key NÃO é segredo).
import { PRODUTOS, precoItem, precoTeste } from './_lib/produtos.js';

// CHECKOUT_V2=1 liga o visual novo (cabeçalho "ofertas exclusivas" e mensagens reais de alunos). Sem ela, o checkout fica como estava.
export default function handler(req, res) {
  const id = String(req.query.p || '');
  const p = PRODUTOS[id];
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    teste: !!precoTeste(),
    v2: process.env.CHECKOUT_V2 === '1',
    publicKey: process.env.MP_PUBLIC_KEY || '',
    pixelId: process.env[`META_PIXEL_ID_${id.toUpperCase()}`] || process.env.META_PIXEL_ID || '',
    produto: { id, nome: p.titulo || p.nome, preco: precoItem(p.preco), precoSaida: p.precoSaida ? precoItem(p.precoSaida) : 0, imagemSaida: p.imagemSaida || '', appUrl: p.appUrl, imagem: p.imagem || '', depoimentos: process.env.CHECKOUT_V2 === '1' ? (p.depoimentos || []) : [], bumps: p.bumps.map(({ id, nome, titulo, desc, preco, de, imagem }) => ({ id, nome: titulo || nome, desc, preco: precoItem(preco), de: de || 0, imagem: imagem || '' })) },
  });
}
