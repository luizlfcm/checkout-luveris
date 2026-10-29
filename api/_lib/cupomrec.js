// Cupom da recuperação: no último e-mail da sequência do Pix (pix3, dia 3) o lead que gerou o Pix e não pagou ganha pct% de desconto
// no produto principal, com prazo REAL (o servidor só dá o desconto entre o envio do e-mail e o fim da validade).
// RECUPERACAO_CUPOM=0 desliga o pix3; RECUPERACAO_PCT muda o desconto (0-90). Só Premium e Auto Pro (config cupomRec em produtos.js).
import { cmd } from './redis.js';
import { PRODUTOS } from './produtos.js';

const HORA = 3600 * 1000;
export const chaveCupomRec = (produto, email) => `chk_cuprec:${produto}:${String(email).toLowerCase()}`;

export function cfgCupomRec(produtoId) {
  const c = PRODUTOS[produtoId]?.cupomRec;
  if (!c || process.env.RECUPERACAO_CUPOM === '0') return null;
  const env = process.env.RECUPERACAO_PCT;
  const pct = env !== undefined && env !== '' && Number.isFinite(Number(env)) && Number(env) >= 0 && Number(env) <= 90 ? Number(env) : c.pct;
  return { pct, horas: c.horas || 72, validadeH: c.validadeH || 24 };
}

// Registra a janela do cupom (começa quando o e-mail sai). Retorna { de, ate, pct } ou null.
export async function abrirCupomRec(produtoId, email, quandoEnvio) {
  const c = cfgCupomRec(produtoId);
  if (!c) return null;
  const j = { de: quandoEnvio, ate: quandoEnvio + c.validadeH * HORA, pct: c.pct };
  await cmd(['SET', chaveCupomRec(produtoId, email), JSON.stringify(j), 'EX', String(60 * 60 * 24 * 6)]);
  return j;
}

// Cupom valendo AGORA para este e-mail neste produto (ou null).
export async function cupomRecAtivo(produtoId, email) {
  if (!cfgCupomRec(produtoId) || !email) return null;
  try {
    const raw = await cmd(['GET', chaveCupomRec(produtoId, email)]);
    if (!raw) return null;
    const j = JSON.parse(raw), t = Date.now();
    return t >= j.de && t < j.ate && j.pct > 0 ? j : null;
  } catch (e) { return null; }
}

export const limparCupomRec = (produtoId, email) => cmd(['DEL', chaveCupomRec(produtoId, email)]).catch(() => {});
