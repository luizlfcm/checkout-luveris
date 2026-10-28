// Pós-venda por e-mail do produto principal (Premium, Auto Pro): oferece o que a pessoa ainda não tem.
//  - posVenda: ofertas simples (ex.: pv1 = um item, 24 h depois);
//  - pacote: e-mails com cupom (pv3 no dia 3, pv4 na reta final) para levar TODOS os itens que faltam com pct% de desconto.
// Agendado no Resend (scheduled_at). Compartilha a chave e o cancelamento do upgrade (cancelarUpsell / "parar").
import { cmd } from './redis.js';
import { PRODUTOS } from './produtos.js';
import { enviarPosVenda } from './email.js';
import { chaveMails, chaveParar, cancelarUpsell } from './upgrade.js';
import { abrirCupom, cfgPacote, chavePacote, faltantes } from './pacote.js';

const HORA = 3600 * 1000;
const ativo = () => process.env.POSVENDA_EMAILS !== '0';
const TTL = String(60 * 60 * 24 * 8);

async function agendarCupons(reg, inicio, fim) {
  const c = cfgPacote(reg.produto);
  if (!c) return [];
  const f = await faltantes(reg.produto, reg.email);
  if (!f || !f.cliente || !f.faltam.length) return [];
  const itens = [];
  for (const e of c.emails) {
    const quando = inicio + e.horas * HORA;
    if (quando <= Date.now() + 60 * 1000 || quando >= fim) continue;
    const r = await enviarPosVenda(reg, { tipo: e.tipo }, { agendarEm: new Date(quando).toISOString(), faltam: f.faltam, expiraEm: fim, pct: c.pct });
    if (r.enviado && r.id) itens.push({ id: r.id, quando, tipo: e.tipo });
  }
  return itens;
}

export async function agendarPosVenda(reg) {
  const p = PRODUTOS[reg.produto];
  if ((!p?.posVenda && !p?.pacote) || reg.avulso || !ativo()) return;
  try {
    const email = String(reg.email).toLowerCase();
    if (await cmd(['GET', chaveParar(email)])) return;
    // Uma sequência por cliente: segunda compra do mesmo produto não duplica os e-mails.
    const trava = await cmd(['SET', chaveMails(reg.produto, email), JSON.stringify({ itens: [] }), 'NX', 'EX', TTL]);
    if (!trava) return;
    // O que a pessoa já tem (compra atual + acessos anteriores) não é oferecido de novo.
    let tem = {};
    try { const raw = await cmd(['GET', `${p.redisPrefix}${email}`]); if (raw) tem = JSON.parse(raw); } catch (e) { /* sem registro */ }
    const comprados = new Set([...(reg.bumps || []), ...(reg.flags || []), ...Object.keys(tem).filter((k) => tem[k] === true)]);
    const itens = [];
    for (const e of p.posVenda || []) {
      if (comprados.has(e.item)) continue;
      const quando = Date.now() + e.horas * HORA;
      const r = await enviarPosVenda(reg, e, { agendarEm: new Date(quando).toISOString() });
      if (r.enviado && r.id) itens.push({ id: r.id, quando, tipo: e.tipo });
    }
    if (p.pacote) {
      const inicio = Date.now();
      const fim = await abrirCupom(reg.produto, email, inicio);
      if (fim) itens.push(...await agendarCupons(reg, fim - cfgPacote(reg.produto).janelaH * HORA, fim));
    }
    await cmd(['SET', chaveMails(reg.produto, email), JSON.stringify({ itens }), 'EX', TTL]);
    console.log('pós-venda: agendado', { produto: reg.produto, emails: itens.map((i) => i.tipo) });
  } catch (e) { console.error('pós-venda: falha ao agendar', e?.message); }
}

// Depois que o cliente compra UM item do pacote por fora (link avulso, no preço cheio), os e-mails do cupom que ainda não saíram
// são refeitos só com o que continua faltando (ou cancelados, se não falta mais nada).
export async function reagendarCupom(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p?.pacote || !ativo()) return;
  try {
    const email = String(reg.email).toLowerCase();
    if (await cmd(['GET', chaveParar(email)])) return;
    const fim = Number(await cmd(['GET', chavePacote(reg.produto, email)]));
    if (!Number.isFinite(fim) || fim <= Date.now()) return;
    await cancelarUpsell(reg.produto, email, ['pv3', 'pv4']);
    let atuais = [];
    try { const raw = await cmd(['GET', chaveMails(reg.produto, email)]); if (raw) atuais = JSON.parse(raw).itens || []; } catch (e) { /* lista vazia */ }
    const novos = await agendarCupons({ ...reg, avulso: '' }, fim - cfgPacote(reg.produto).janelaH * HORA, fim);
    await cmd(['SET', chaveMails(reg.produto, email), JSON.stringify({ itens: [...atuais, ...novos] }), 'EX', TTL]);
    console.log('pós-venda: cupom reagendado', { produto: reg.produto, emails: novos.map((i) => i.tipo) });
  } catch (e) { console.error('pós-venda: falha ao reagendar cupom', e?.message); }
}
