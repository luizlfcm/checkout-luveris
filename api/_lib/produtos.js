// Catálogo de produtos do checkout. O PREÇO É SEMPRE CALCULADO AQUI (servidor),
// nunca confiamos no valor enviado pelo navegador.
// flag = campo gravado no Upstash (mesmo formato do n8n / painel / webhook Hotmart).

export const PRODUTOS = {
  fdl: {
    nome: 'Fábrica da Limpeza',
    preco: 43.90, hotmartId: 4425534, // id da oferta no dashboard (mesmo da Hotmart)
    precoSaida: 39.50, imagemSaida: '/img/saida-fdl.webp', // pop-up de saída (10% off, só no produto principal)
    flag: 'base',
    redisPrefix: 'fdl_cliente:',
    tokenPrefix: 'FDL_',
    appUrl: 'https://fabricadalimpeza.luverisgroup.com.br/',
    emailFrom: 'Fábrica da Limpeza <noreply@mail.luverisgroup.com.br>',
    titulo: 'Fábrica da Limpeza Premium — +200 Fórmulas de Produtos de Limpeza Profissionais',
    imagem: '/img/fdl.webp',
    cor: '#3A8A4E', bg: '#0D1410', rodape: 'João Silva - Engenheiro Químico - Fábrica da Limpeza',
    depoimentos: [
      { texto: 'Fiz sua fórmula reduzida em 5 litros, ficou um espetáculo, muito rápido, mais econômico. Adorei muito. Sabão tradicional.' },
      { texto: 'Boa tarde. Fiz esses aí… comprei essência de lavanda. Lavei minhas roupas, fez muita espuma e ficou cheirosa demais.' },
      { texto: 'Boa noite, passando pra avisar que essa ficou ótima, com um custo excelente e a limpeza também 👍👍👍' },
    ],
    // Links de pagamento avulsos (/fdl/<id>): ofertas vendidas dentro do app, só o item (sem produto principal, sem bumps).
    avulsos: [
      { id: 'limp', flag: 'limp', hotmartId: 5959285, preco: 9.90, nome: 'Ouro Automotivo — 15 Fórmulas', titulo: 'Ouro Automotivo — 15 Fórmulas de Produtos Automotivos Profissionais', imagem: '/img/bump-ouro.webp' },
      { id: 'perf', flag: 'perf', hotmartId: 5959154, preco: 9.90, nome: 'Perfumes de Casa de Rico', titulo: 'Perfumes de Casa de Rico', imagem: '' },
      { id: 'leg', flag: 'leg', hotmartId: 6000725, preco: 9.90, nome: 'Guia de Legalização Rápida', titulo: 'Guia de Legalização Rápida', imagem: '' },
      { id: 'form', flag: 'form', hotmartId: 4447291, preco: 19.90, nome: 'Fórmula Personalizada Premium', titulo: 'Fórmula Personalizada Premium – Um Especialista Ajustando Sua Produção', imagem: '/img/bump-personalizada.webp', whatsapp: 'Ola Joao! Comprei a Formula Personalizada Premium.' },
    ],
    bumps: [
      {
        id: 'limp', flag: 'limp', hotmartId: 5959285, preco: 14.90, de: 58.70, imagem: '/img/bump-ouro.webp',
        nome: 'Ouro Automotivo — 15 Fórmulas', titulo: 'Ouro Automotivo — 15 Fórmulas de Produtos Automotivos Profissionais',
        desc: 'Aumente sua linha de produtos sem comprar outro curso: 15 fórmulas profissionais de estética automotiva, no mesmo padrão da Fábrica da Limpeza, prontas para produzir e vender aos mesmos clientes.',
      },
      {
        id: 'form', flag: 'form', hotmartId: 4447291, preco: 24.90, de: 121.37, imagem: '/img/bump-personalizada.webp',
        nome: 'Fórmula Personalizada Premium', titulo: 'Fórmula Personalizada Premium – Um Especialista Ajustando Sua Produção', whatsapp: 'Ola Joao! Comprei a Formula Personalizada Premium.',
        desc: 'Conte o que você precisa e receba de 3 a 5 fórmulas criadas por um especialista só para o seu negócio. Prazo de até 3 dias úteis.',
      },
    ],
  },
  ap: {
    nome: 'Fórmula Auto Pro',
    preco: 41.90, hotmartId: 7926953,
    precoSaida: 37.70, imagemSaida: '/img/saida-ap.webp',
    flag: 'base',
    redisPrefix: 'cliente:',
    tokenPrefix: 'FAP_',
    appUrl: 'https://formulaauto.luverisgroup.com.br/',
    emailFrom: 'Formula Auto Pro <noreply@mail.luverisgroup.com.br>',
    titulo: 'Fórmula Auto Pro – 80 Fórmulas de Produtos Automotivos Profissionais',
    imagem: '/img/ap.webp',
    cor: '#E8720C', bg: '#0D0F12', rodape: 'João Silva - Engenheiro Químico - Fórmula Auto Pro',
    depoimentos: [
      { texto: 'Ficou top, melhorou muito a viscosidade. Muito obrigado.', detalhe: 'Fez 200 litros de shampoo' },
      { texto: 'Deu certo sim, achei que melhorou a viscosidade. Vou envasar agora.', data: '16/04/2026' },
    ],
    // Links de pagamento avulsos (/ap/<id>): ofertas vendidas dentro do app, só o item (sem produto principal, sem bumps).
    avulsos: [
      { id: 'limp', flag: 'limp', hotmartId: 7927216, preco: 9.90, nome: '50 Fórmulas de Limpeza', titulo: '50 Fórmulas de Limpeza — Expanda Sua Linha de Produtos', imagem: '/img/bump-50formulas.webp' },
      { id: 'leg', flag: 'leg', hotmartId: 7927079, preco: 9.90, nome: 'Guia de Legalização', titulo: 'Guia de Legalização — Venda Seus Produtos do Jeito Certo', imagem: '' },
      { id: 'form', flag: 'form', hotmartId: 7927025, preco: 19.90, nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', imagem: '/img/bump-exclusiva.webp', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.' },
    ],
    bumps: [
      {
        id: 'limp', flag: 'limp', hotmartId: 7927216, preco: 13.90, de: 54.76, imagem: '/img/bump-50formulas.webp',
        nome: '50 Fórmulas de Limpeza', titulo: '50 Fórmulas de Limpeza — Expanda Sua Linha de Produtos',
        desc: 'Aumente sua linha de produtos sem comprar outro curso: 50 fórmulas profissionais de limpeza doméstica e industrial, no mesmo padrão do Fórmula Auto Pro, prontas para produzir e vender aos mesmos clientes.',
      },
      {
        id: 'form', flag: 'form', hotmartId: 7927025, preco: 24.90, de: 121.37, imagem: '/img/bump-exclusiva.webp',
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

export function calcular(produtoId, bumpIds = [], saida = false, avulsoId = '') {
  const p = PRODUTOS[produtoId];
  if (!p) return null;
  if (avulsoId) {
    // Link avulso: só o item pedido, com o preço do servidor (sem desconto de saída nem bumps).
    const a = (p.avulsos || []).find((x) => x.id === avulsoId);
    if (!a) return null;
    const centavos = Math.round(precoItem(a.preco) * 100);
    return { produto: p, avulso: a, saida: false, itens: [{ produto_id: a.hotmartId, nome: a.nome, valor: centavos / 100 }], flags: [a.flag], centavos, valor: (centavos / 100).toFixed(2), bumps: [], escolhidos: [] };
  }
  const escolhidos = p.bumps.filter((b) => bumpIds.includes(b.id));
  const flags = [p.flag, ...escolhidos.map((b) => b.flag)];
  const centavos = Math.round(precoItem(saida && p.precoSaida ? p.precoSaida : p.preco) * 100) + escolhidos.reduce((s, b) => s + Math.round(precoItem(b.preco) * 100), 0);
  // Itens como o dashboard os registra (um por produto/bump, com o id da oferta).
  const itens = [
    { produto_id: p.hotmartId, nome: p.nome, valor: Math.round(precoItem(saida && p.precoSaida ? p.precoSaida : p.preco) * 100) / 100 },
    ...escolhidos.map((b) => ({ produto_id: b.hotmartId, nome: b.nome, valor: Math.round(precoItem(b.preco) * 100) / 100 })),
  ];
  return { produto: p, saida: !!(saida && p.precoSaida), itens, flags, centavos, valor: (centavos / 100).toFixed(2), bumps: escolhidos.map((b) => b.id), escolhidos };
}
