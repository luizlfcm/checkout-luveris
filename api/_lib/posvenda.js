// Pós-venda por e-mail do produto principal (ex.: Fábrica da Limpeza Premium): oferece os itens que a pessoa ainda não tem.
// Agendado no Resend (scheduled_at). Compartilha a chave e o cancelamento do upgrade (cancelarUpsell / "parar").
import { cmd } from './redis.js';
import { PRODUTOS } from './produtos.js';
import { enviarPosVenda } from './email.js';
import { chaveMails, chaveParar } from './upgrade.js';

const HORA = 3600 * 1000;
const ativo = () => process.env.POSVENDA_EMAILS !== '0';

export async function agendarPosVenda(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p?.posVenda || reg.avulso || !ativo()) return;
  try {
    const email = String(reg.email).toLowerCase();
    if (await cmd(['GET', chaveParar(email)])) return;
    // Uma sequência por cliente: segunda compra do mesmo produto não duplica os e-mails.
    const trava = await cmd(['SET', chaveMails(reg.produto, email), JSON.stringify({ itens: [] }), 'NX', 'EX', String(60 * 60 * 24 * 8)]);
    if (!trava) return;
    // O que a pessoa já tem (compra atual + acessos anteriores) não é oferecido de novo.
    let tem = {};
    try { const raw = await cmd(['GET', `${p.redisPrefix}${email}`]); if (raw) tem = JSON.parse(raw); } catch (e) { /* sem registro */ }
    const comprados = new Set([...(reg.bumps || []), ...(reg.flags || []), ...Object.keys(tem).filter((k) => tem[k] === true)]);
    const itens = [];
    for (const e of p.posVenda) {
      if (comprados.has(e.item)) continue;
      const quando = Date.now() + e.horas * HORA;
      const r = await enviarPosVenda(reg, e, { agendarEm: new Date(quando).toISOString() });
      if (r.enviado && r.id) itens.push({ id: r.id, quando, tipo: e.tipo });
    }
    await cmd(['SET', chaveMails(reg.produto, email), JSON.stringify({ itens }), 'EX', String(60 * 60 * 24 * 8)]);
    console.log('pós-venda: agendado', { produto: reg.produto, emails: itens.map((i) => i.tipo) });
  } catch (e) { console.error('pós-venda: falha ao agendar', e?.message); }
}
