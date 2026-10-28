// Dados públicos que o navegador precisa (Public Key NÃO é segredo).
import { PRODUTOS, precoItem, precoTeste, envId } from './_lib/produtos.js';
import { precoUpgrade } from './_lib/upgrade.js';
import { precoPacote, cfgPacote } from './_lib/pacote.js';

// Faixa de Black Friday no topo do checkout. Ligada por padrão e some sozinha depois da data final.
// BLACKFRIDAY=0 desliga; BLACKFRIDAY_ATE (ISO, ex.: 2026-11-30T23:59:59-03:00) muda o dia em que ela some.
function faixaBF(p) {
  const ate = Date.parse(process.env.BLACKFRIDAY_ATE || '2026-11-30T23:59:59-03:00');
  const ativo = process.env.BLACKFRIDAY !== '0' && (!Number.isFinite(ate) || Date.now() <= ate);
  return { ativo, de: p?.bf?.de || 0 };
}

// Cabeçalho "ofertas exclusivas": ligado por padrão (CHECKOUT_EXCLUSIVAS=0 desliga).
// Mensagens reais de alunos: DESLIGADAS por padrão (CHECKOUT_DEPOIMENTOS=1 liga).
export default async function handler(req, res) {
  const id = String(req.query.p || '');
  const p = PRODUTOS[id];
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  const iid = String(req.query.i || '');
  if (iid) {
    // Pacote com desconto (/<produto>/pacote?email=): o servidor diz o que falta para ESTE e-mail, o % e até quando vale.
    if (iid === 'pacote') {
      const c = cfgPacote(id);
      if (!c) return res.status(404).json({ error: 'Item não encontrado' });
      res.setHeader('Cache-Control', 'no-store');
      const em = String(req.query.e || '').trim().toLowerCase();
      const nomePac = 'Pacote com desconto';
      let preco = Math.round(c.itens.reduce((t, k) => t + precoItem((p.avulsos.find((x) => x.id === k) || {}).preco || 0) * 100, 0)) / 100, janela = null, zap = '';
      if (em) {
        const pk = await precoPacote(id, em).catch(() => null);
        if (!pk || !pk.cliente) janela = { pacote: true, indisponivel: 'Não encontramos o acesso à ' + p.nome + ' neste e-mail. Use o mesmo e-mail da sua compra.' };
        else if (!pk.faltam.length) janela = { pacote: true, indisponivel: 'Você já tem todos os itens deste pacote. 🎉' };
        else {
          preco = pk.total;
          janela = { pacote: true, naJanela: pk.naJanela, expiraEm: pk.expiraEm, precoCheio: pk.cheio, pct: pk.pct, itens: pk.faltam.map((i) => ({ nome: i.nome, preco: precoItem(i.preco) })) };
          zap = (pk.faltam.find((i) => i.whatsapp) || {}).whatsapp || '';
        }
      }
      return res.status(200).json({
        teste: !!precoTeste(), exclusivas: false, bf: { ...faixaBF(null) }, publicKey: process.env.MP_PUBLIC_KEY || '', pixelId: '',
        produto: { id, nome: nomePac, preco, janela, precoSaida: 0, imagemSaida: '', appUrl: p.appUrl, imagem: p.imagem || '', depoimentos: [], bumps: [], avulso: { id: 'pacote', whatsapp: '', zap } },
      });
    }
    // Link avulso (/<produto>/<item>): só o item, sem bumps, sem pop-up de saída e sem pixel (a compra vem de dentro do app).
    const a = (p.avulsos || []).find((x) => x.id === iid);
    if (!a) return res.status(404).json({ error: 'Item não encontrado' });
    res.setHeader('Cache-Control', 'no-store');
    // Upgrade com janela: mostra o preço que vale para este e-mail agora (o servidor recalcula na hora de cobrar).
    let precoMostrar = precoItem(a.preco), janela = null;
    const em = String(req.query.e || '').trim().toLowerCase();
    if (a.janelaH) {
      const pu = await precoUpgrade(id, em).catch(() => null);
      if (pu) { precoMostrar = precoItem(pu.preco); janela = { naJanela: pu.naJanela, expiraEm: pu.expiraEm, precoCheio: pu.precoCheio }; }
    }
    return res.status(200).json({
      teste: !!precoTeste(), exclusivas: false, bf: { ...faixaBF(null) }, publicKey: process.env.MP_PUBLIC_KEY || '', pixelId: '',
      produto: { id, nome: a.titulo || a.nome, preco: precoMostrar, janela, precoSaida: 0, imagemSaida: '', appUrl: a.appUrl || p.appUrl, imagem: a.imagem || p.imagem || '', depoimentos: [], bumps: [], avulso: { id: a.id, whatsapp: a.whatsapp || '' } },
    });
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    teste: !!precoTeste(),
    bf: faixaBF(p),
    posVenda: (p.posVenda || []).map((e) => { const a = (p.avulsos || []).find((x) => x.id === e.item); const b = (p.bumps || []).find((x) => x.id === e.item); return a ? { id: a.id, nome: a.nome, preco: precoItem(a.preco), de: b && b.de > a.preco ? b.de : 0, imagem: a.imagem || '', desc: (b && b.desc) || '' } : null; }).filter(Boolean),
    exclusivas: process.env.CHECKOUT_EXCLUSIVAS !== '0',
    publicKey: process.env.MP_PUBLIC_KEY || '',
    pixelId: process.env[`META_PIXEL_ID_${envId(id)}`] || process.env.META_PIXEL_ID || '',
    clarityId: process.env[`CLARITY_ID_${id.toUpperCase()}`] || p.clarityId || '', // Microsoft Clarity (gravação de sessões); o ID não é segredo
    produto: { id, nome: p.titulo || p.nome, preco: precoItem(p.preco), precoSaida: p.precoSaida ? precoItem(p.precoSaida) : 0, imagemSaida: p.imagemSaida || '', appUrl: p.appUrl, imagem: p.imagem || '', cor: p.cor || '', bg: p.bg || '', imagemUp: (p.avulsos || []).find((x) => x.id === 'upg')?.imagem || '', upsell: p.upsell ? { ...p.upsell, preco: (p.avulsos || []).find((x) => x.id === 'upg')?.preco, precoCheio: (p.avulsos || []).find((x) => x.id === 'upg')?.precoCheio } : null, depoimentos: process.env.CHECKOUT_DEPOIMENTOS === '1' ? (p.depoimentos || []) : [], bumps: p.bumps.map(({ id, nome, titulo, desc, cta, preco, de, imagem }) => ({ id, nome: titulo || nome, desc, cta: cta || '', preco: precoItem(preco), de: de || 0, imagem: imagem || '' })) },
  });
}
