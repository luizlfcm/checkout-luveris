// "Pacote": link /<produto>/pacote?email=... que leva TODOS os itens que o cliente ainda não tem (hoje Ouro/50 Fórmulas + Fórmula Exclusiva)
// com desconto em % válido por um prazo real. O servidor decide o que falta e o preço; o navegador nunca manda valor.
import { cmd } from './redis.js';
import { PRODUTOS, precoItem } from './produtos.js';

const HORA = 3600 * 1000;
export const chavePacote = (produto, email) => `chk_pacote:${produto}:${String(email).toLowerCase()}`;
export const cfgPacote = (produtoId) => {
  const c = PRODUTOS[produtoId]?.pacote;
  if (!c) return null;
  const pct = Number(process.env.PACOTE_PCT);
  return { ...c, pct: Number.isFinite(pct) && pct >= 0 && pct <= 90 && process.env.PACOTE_PCT ? pct : c.pct, janelaH: c.janelaH || 120 };
};

// Abre a janela do cupom na 1ª compra do produto principal (não reabre em compras seguintes). Retorna o instante em que termina (ms).
export async function abrirCupom(produtoId, email, inicio = Date.now()) {
  const c = cfgPacote(produtoId);
  if (!c) return 0;
  const fim = inicio + c.janelaH * HORA;
  const novo = await cmd(['SET', chavePacote(produtoId, email), String(fim), 'NX', 'EX', String(60 * 60 * 24 * 30)]);
  if (novo) return fim;
  const atual = Number(await cmd(['GET', chavePacote(produtoId, email)]));
  return Number.isFinite(atual) && atual > 0 ? atual : 0;
}

// O que o e-mail já tem e o que falta do pacote. { cliente (tem o principal), faltam: [{id,flag,nome,hotmartId,preco,whatsapp,desc}] }
export async function faltantes(produtoId, email) {
  const p = PRODUTOS[produtoId], c = cfgPacote(produtoId);
  if (!p || !c) return null;
  let tem = {};
  try { const raw = await cmd(['GET', `${p.redisPrefix}${String(email).toLowerCase()}`]); if (raw) tem = JSON.parse(raw); } catch (e) { /* sem registro */ }
  const faltam = c.itens.filter((id) => tem[(p.avulsos.find((a) => a.id === id) || {}).flag] !== true).map((id) => {
    const a = p.avulsos.find((x) => x.id === id), b = (p.bumps || []).find((x) => x.id === id);
    return { id, flag: a.flag, nome: a.nome, hotmartId: a.hotmartId, preco: a.preco, whatsapp: a.whatsapp || '', desc: (b && b.desc) || '' };
  });
  return { cliente: tem[p.flag] === true, faltam };
}

// Preço do pacote para este e-mail agora. null = produto sem pacote.
export async function precoPacote(produtoId, email) {
  const c = cfgPacote(produtoId);
  if (!c) return null;
  const f = await faltantes(produtoId, email);
  let fim = 0;
  try { const v = Number(await cmd(['GET', chavePacote(produtoId, email)])); fim = Number.isFinite(v) ? v : 0; } catch (e) { /* sem janela = sem desconto */ }
  const naJanela = fim > Date.now();
  const cheio = f.faltam.reduce((s, i) => s + Math.round(precoItem(i.preco) * 100), 0);
  const total = naJanela ? Math.round(cheio * (100 - c.pct) / 100) : cheio;
  return { ...f, pct: c.pct, naJanela, expiraEm: fim, cheio: cheio / 100, total: total / 100, totalCentavos: total, cheioCentavos: cheio };
}

// Mesmo formato do calcular() do catálogo, para o pagar.js e o dashboard (um item por oferta, com o valor já com desconto).
export async function calcularPacote(produtoId, email) {
  const pk = await precoPacote(produtoId, email);
  if (!pk || !pk.cliente || !pk.faltam.length) return null;
  const p = PRODUTOS[produtoId];
  const desc = pk.naJanela ? (100 - pk.pct) / 100 : 1;
  let resto = pk.totalCentavos;
  const itens = pk.faltam.map((i, idx) => {
    const v = idx === pk.faltam.length - 1 ? resto : Math.round(Math.round(precoItem(i.preco) * 100) * desc);
    resto -= v;
    return { produto_id: i.hotmartId, nome: i.nome, valor: v / 100 };
  });
  return {
    produto: p, avulso: { id: 'pacote', nome: `Pacote ${pk.faltam.map((i) => i.nome).join(' + ')}` }, saida: false, itens, flags: pk.faltam.map((i) => i.flag),
    centavos: pk.totalCentavos, valor: (pk.totalCentavos / 100).toFixed(2), bumps: [], escolhidos: [], pacote: pk,
  };
}
