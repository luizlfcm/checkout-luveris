// Catálogo de produtos do checkout. O PREÇO É SEMPRE CALCULADO AQUI (servidor),
// nunca confiamos no valor enviado pelo navegador.
// flag = campo gravado no Upstash (mesmo formato do n8n / painel / webhook Hotmart).

export const PRODUTOS = {
  fdl: {
    nome: 'Fábrica da Limpeza',
    preco: 43.90,
    flag: 'base',
    redisPrefix: 'fdl_cliente:',
    tokenPrefix: 'FDL_',
    appUrl: 'https://fabricadalimpeza.luverisgroup.com.br/',
    // Order bumps: preencher quando definirmos preços/textos. Exemplo:
    // { id: 'limp', flag: 'limp', nome: 'Ouro Automotivo', desc: '...', preco: 19.90 }
    bumps: [],
  },
  ap: {
    nome: 'Fórmula Auto Pro',
    preco: 41.90,
    flag: 'base',
    redisPrefix: 'cliente:',
    tokenPrefix: 'FAP_',
    appUrl: 'https://formulaauto.luverisgroup.com.br/',
    bumps: [],
  },
};

export function calcular(produtoId, bumpIds = []) {
  const p = PRODUTOS[produtoId];
  if (!p) return null;
  const escolhidos = p.bumps.filter((b) => bumpIds.includes(b.id));
  const flags = [p.flag, ...escolhidos.map((b) => b.flag)];
  const centavos = Math.round(p.preco * 100) + escolhidos.reduce((s, b) => s + Math.round(b.preco * 100), 0);
  return { produto: p, flags, centavos, valor: (centavos / 100).toFixed(2), bumps: escolhidos.map((b) => b.id) };
}
