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
    emailFrom: 'Fábrica da Limpeza <noreply@mail.luverisgroup.com.br>',
    titulo: 'Fábrica da Limpeza Premium — +200 Fórmulas de Produtos de Limpeza Profissionais',
    imagem: '/img/fdl.webp',
    cor: '#3A8A4E', bg: '#0D1410', rodape: 'João Silva - Engenheiro Químico - Fábrica da Limpeza',
    bumps: [
      {
        id: 'limp', flag: 'limp', preco: 14.90, de: 58.70, imagem: '/img/bump-ouro.webp',
        nome: 'Ouro Automotivo — 15 Fórmulas', titulo: 'Ouro Automotivo — 15 Fórmulas de Produtos Automotivos Profissionais',
        desc: 'Aumente sua linha de produtos sem comprar outro curso: 15 fórmulas profissionais de estética automotiva, no mesmo padrão da Fábrica da Limpeza, prontas para produzir e vender aos mesmos clientes.',
      },
      {
        id: 'form', flag: 'form', preco: 24.90, de: 121.37, imagem: '/img/bump-personalizada.webp',
        nome: 'Fórmula Personalizada Premium', titulo: 'Fórmula Personalizada Premium – Um Especialista Ajustando Sua Produção', whatsapp: 'Ola Joao! Comprei a Formula Personalizada Premium.',
        desc: 'Conte o que você precisa e receba de 3 a 5 fórmulas criadas por um especialista só para o seu negócio. Prazo de até 3 dias úteis.',
      },
    ],
  },
  ap: {
    nome: 'Fórmula Auto Pro',
    preco: 41.90,
    flag: 'base',
    redisPrefix: 'cliente:',
    tokenPrefix: 'FAP_',
    appUrl: 'https://formulaauto.luverisgroup.com.br/',
    emailFrom: 'Formula Auto Pro <noreply@mail.luverisgroup.com.br>',
    titulo: 'Fórmula Auto Pro – 80 Fórmulas de Produtos Automotivos Profissionais',
    imagem: '/img/ap.webp',
    cor: '#E8720C', bg: '#0D0F12', rodape: 'João Silva - Engenheiro Químico - Fórmula Auto Pro',
    bumps: [
      {
        id: 'limp', flag: 'limp', preco: 13.90, de: 54.76, imagem: '/img/bump-50formulas.webp',
        nome: '50 Fórmulas de Limpeza', titulo: '50 Fórmulas de Limpeza — Expanda Sua Linha de Produtos',
        desc: 'Aumente sua linha de produtos sem comprar outro curso: 50 fórmulas profissionais de limpeza doméstica e industrial, no mesmo padrão do Fórmula Auto Pro, prontas para produzir e vender aos mesmos clientes.',
      },
      {
        id: 'form', flag: 'form', preco: 24.90, de: 121.37, imagem: '/img/bump-exclusiva.webp',
        nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.',
        desc: 'Conte o que você precisa e receba de 3 a 5 fórmulas criadas por um especialista só para o seu segmento. Prazo de até 3 dias úteis.',
      },
    ],
  },
};

// Bump com `whatsapp` = entrega manual: o e-mail leva o botão do WhatsApp (sem acesso no app).
// Modo de teste: se PRECO_TESTE_CENTAVOS existir (ex.: 100), cada item (produto e bumps) custa esse valor.
export function precoTeste() {
  const n = parseInt(process.env.PRECO_TESTE_CENTAVOS || '', 10);
  return n >= 1 && n <= 1000 ? n : 0;
}
export const precoItem = (preco) => (precoTeste() ? precoTeste() / 100 : preco);

export function calcular(produtoId, bumpIds = []) {
  const p = PRODUTOS[produtoId];
  if (!p) return null;
  const escolhidos = p.bumps.filter((b) => bumpIds.includes(b.id));
  const flags = [p.flag, ...escolhidos.map((b) => b.flag)];
  const centavos = Math.round(precoItem(p.preco) * 100) + escolhidos.reduce((s, b) => s + Math.round(precoItem(b.preco) * 100), 0);
  return { produto: p, flags, centavos, valor: (centavos / 100).toFixed(2), bumps: escolhidos.map((b) => b.id), escolhidos };
}
