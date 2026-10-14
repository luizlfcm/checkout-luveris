// Quem faz o upgrade do Essencial para a Completa passa a usar UM app só (o da Completa).
// Os extras comprados no Essencial (ouro automotivo, guia, perfumes, fórmula exclusiva...) ficam gravados na chave
// do Essencial; aqui eles são copiados para a chave da Completa, para o cliente achar tudo no mesmo login.
// Depois do upgrade, tudo que ele comprar ou for reembolsado no Essencial também é espelhado (sempre pelo e-mail).
import { cmd, setFlag } from './redis.js';
import { PRODUTOS } from './produtos.js';

export const FLAGS_ESPELHADAS = ['limp', 'perf', 'leg', 'form'];

// Produto Completa que corresponde a um Essencial (via oferta de upgrade), ou null.
export function produtoCompleto(produto) {
  const upg = (produto?.avulsos || []).find((a) => a.id === 'upg');
  return (upg?.tambem && PRODUTOS[upg.tambem.produto]) || null;
}

async function registroDe(produto, email) {
  try {
    const raw = await cmd(['GET', `${produto.redisPrefix}${email}`]);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { console.error('espelho: leitura falhou', e?.message); return null; }
}

// Chame depois de gravar as flags do pedido. `ligar` = true na aprovação, false no reembolso.
// - Pedido do upgrade: copia para a Completa tudo que o cliente já tinha no Essencial.
// - Outro pedido de quem já fez o upgrade: copia só as flags desse pedido.
export async function espelharNoCompleto(produto, reg, ligar) {
  try {
    const destino = produtoCompleto(produto);
    if (!destino || !reg?.email) return [];
    const ehUpgrade = reg.avulso === 'upg';
    if (ehUpgrade && !ligar) return []; // reembolso do upgrade: o que já foi comprado fica
    const atual = await registroDe(produto, reg.email);
    if (!ehUpgrade && !atual?.upg) return []; // ainda não fez o upgrade: nada a espelhar
    const flags = ehUpgrade
      ? FLAGS_ESPELHADAS.filter((f) => atual?.[f])
      : (reg.flags || []).filter((f) => FLAGS_ESPELHADAS.includes(f));
    for (const f of flags) await setFlag(destino, reg.email, reg.nome, f, ligar);
    if (flags.length) console.log('espelho: copiado para a Completa', { produto: reg.produto, destino: destino.nome, flags, ligar });
    return flags;
  } catch (e) { console.error('espelho: falha (não bloqueia o pedido)', e?.message); return []; }
}
