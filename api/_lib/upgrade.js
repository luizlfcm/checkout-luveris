// Janela do upgrade (Essencial -> Completa). O preço é decidido SEMPRE aqui no servidor:
// dentro de janelaH horas da compra do Essencial vale o preço com crédito; depois, o preço cheio da Completa.
import { cmd } from './redis.js';
import { PRODUTOS } from './produtos.js';
import { enviarUpsell } from './email.js';

const chaveInicio = (produto, email) => `chk_upg:${produto}:${String(email).toLowerCase()}`;
const chaveMails = (produto, email) => `chk_upgmail:${produto}:${String(email).toLowerCase()}`;
export const chaveParar = (email) => `chk_rec_parar:${String(email).toLowerCase()}`; // mesma chave do "parar" da recuperação
const HORA = 3600 * 1000;
const ativo = () => process.env.UPSELL_EMAILS !== '0';

export const avulsoUpg = (produtoId) => (PRODUTOS[produtoId]?.avulsos || []).find((a) => a.id === 'upg') || null;

// { preco, precoCheio, naJanela, expiraEm (ms) }
export async function precoUpgrade(produtoId, email) {
  const a = avulsoUpg(produtoId);
  if (!a) return null;
  let inicio = 0;
  try { const v = await cmd(['GET', chaveInicio(produtoId, email)]); inicio = v ? Date.parse(v) : 0; } catch (e) { /* sem registro = preço cheio */ }
  const expiraEm = inicio ? inicio + (a.janelaH || 72) * HORA : 0;
  const naJanela = !!inicio && Date.now() < expiraEm;
  return { preco: naJanela ? a.preco : (a.precoCheio || a.preco), precoPromo: a.preco, precoCheio: a.precoCheio || a.preco, naJanela, expiraEm: expiraEm || 0 };
}

// Chamada na 1ª confirmação de pagamento do Essencial (front): abre a janela e agenda os e-mails do dia 1 e do dia 3.
export async function abrirJanela(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p?.upsell || reg.avulso) return;
  try {
    const email = String(reg.email).toLowerCase();
    const ja = await cmd(['SET', chaveInicio(reg.produto, email), new Date().toISOString(), 'NX', 'EX', String(60 * 60 * 24 * 90)]);
    if (!ja) return; // janela já aberta (ex.: segunda compra): mantém a primeira
    if (!ativo() || await cmd(['GET', chaveParar(email)])) return;
    const inicio = Date.now();
    const plano = [{ tipo: 'd1', quando: inicio + 24 * HORA }, { tipo: 'd3', quando: inicio + 66 * HORA }]; // d3 sai 6h antes de fechar
    const itens = [];
    for (const e of plano) {
      const r = await enviarUpsell(reg, e.tipo, { agendarEm: new Date(e.quando).toISOString(), expiraEm: inicio + (avulsoUpg(reg.produto).janelaH || 72) * HORA });
      if (r.enviado && r.id) itens.push({ id: r.id, quando: e.quando, tipo: e.tipo });
    }
    await cmd(['SET', chaveMails(reg.produto, email), JSON.stringify({ itens }), 'EX', String(60 * 60 * 24 * 6)]);
    console.log('upgrade: janela aberta', { produto: reg.produto, emails: itens.map((i) => i.tipo) });
  } catch (e) { console.error('upgrade: falha ao abrir janela', e?.message); }
}

// Cancela os e-mails que ainda não saíram (comprou o upgrade, pediu reembolso ou clicou em "parar").
export async function cancelarUpsell(produtoId, email) {
  try {
    const raw = await cmd(['GET', chaveMails(produtoId, email)]);
    if (!raw) return;
    const key = process.env.RESEND_API_KEY;
    for (const it of JSON.parse(raw).itens || []) {
      if (it.quando <= Date.now() || !key) continue;
      await fetch(`https://api.resend.com/emails/${encodeURIComponent(it.id)}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${key}` } })
        .then(async (r) => { if (!r.ok) console.error('upgrade: cancelar falhou', r.status); })
        .catch((e) => console.error('upgrade: cancelar erro', e?.message));
    }
    await cmd(['DEL', chaveMails(produtoId, email)]);
  } catch (e) { console.error('upgrade: falha ao cancelar', e?.message); }
}
export const cancelarTodosUpsell = async (email) => { for (const id of Object.keys(PRODUTOS)) if (PRODUTOS[id].upsell) await cancelarUpsell(id, email); };
