// Dados públicos que o navegador precisa (Public Key NÃO é segredo).
import { PRODUTOS, precoItem, precoTeste } from './_lib/produtos.js';

// Cabeçalho "ofertas exclusivas": ligado por padrão (CHECKOUT_EXCLUSIVAS=0 desliga).
// Mensagens reais de alunos: DESLIGADAS por padrão (CHECKOUT_DEPOIMENTOS=1 liga).
export default function handler(req, res) {
  const id = String(req.query.p || '');
  const p = PRODUTOS[id];
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  const iid = String(req.query.i || '');
  if (iid) {
    // Link avulso (/<produto>/<item>): só o item, sem bumps, sem pop-up de saída e sem pixel (a compra vem de dentro do app).
    const a = (p.avulsos || []).find((x) => x.id === iid);
    if (!a) return res.status(404).json({ error: 'Item não encontrado' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      teste: !!precoTeste(), exclusivas: false, publicKey: process.env.MP_PUBLIC_KEY || '', pixelId: '',
      produto: { id, nome: a.titulo || a.nome, preco: precoItem(a.preco), precoSaida: 0, imagemSaida: '', appUrl: p.appUrl, imagem: a.imagem || p.imagem || '', depoimentos: [], bumps: [], avulso: { id: a.id, whatsapp: a.whatsapp || '' } },
    });
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    teste: !!precoTeste(),
    exclusivas: process.env.CHECKOUT_EXCLUSIVAS !== '0',
    publicKey: process.env.MP_PUBLIC_KEY || '',
    pixelId: process.env[`META_PIXEL_ID_${id.toUpperCase()}`] || process.env.META_PIXEL_ID || '',
    produto: { id, nome: p.titulo || p.nome, preco: precoItem(p.preco), precoSaida: p.precoSaida ? precoItem(p.precoSaida) : 0, imagemSaida: p.imagemSaida || '', appUrl: p.appUrl, imagem: p.imagem || '', depoimentos: process.env.CHECKOUT_DEPOIMENTOS === '1' ? (p.depoimentos || []) : [], bumps: p.bumps.map(({ id, nome, titulo, desc, preco, de, imagem }) => ({ id, nome: titulo || nome, desc, preco: precoItem(preco), de: de || 0, imagem: imagem || '' })) },
  });
}
