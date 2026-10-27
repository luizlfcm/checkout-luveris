// Catálogo de produtos do checkout. O PREÇO É SEMPRE CALCULADO AQUI (servidor),
// nunca confiamos no valor enviado pelo navegador.
// flag = campo gravado no Upstash (mesmo formato do n8n / painel / webhook Hotmart).

export const PRODUTOS = {
  fdl: {
    nome: 'Fábrica da Limpeza',
    preco: 37.00, hotmartId: 4425534, // id da oferta no dashboard (mesmo da Hotmart)
    precoSaida: 0, // pop-up de saída desligado no Premium (a imagem /img/saida-fdl.webp tem o preço antigo escrito; para religar: precoSaida: 33.30 + imagemSaida com arte nova)
    flag: 'base',
    redisPrefix: 'fdl_cliente:',
    tokenPrefix: 'FDL_',
    clarityId: 'yvjzyrj5l5',
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
      { id: 'limp', flag: 'limp', hotmartId: 5959285, preco: 9.90, nome: 'Ouro Automotivo — 30 Fórmulas', titulo: 'Ouro Automotivo — 30 Fórmulas de Produtos Automotivos Profissionais', imagem: '/img/avulso-ouro.webp' },
      { id: 'perf', flag: 'perf', hotmartId: 5959154, preco: 6.90, nome: 'Perfumes de Casa de Rico', titulo: 'Perfumes de Casa de Rico', imagem: '/img/avulso-perfumes.webp' },
      { id: 'leg', flag: 'leg', hotmartId: 6000725, preco: 13.90, nome: 'Guia de Legalização Rápida', titulo: 'Guia de Legalização Rápida', imagem: '/img/avulso-legalizacao-fdl.webp' },
      { id: 'form', flag: 'form', hotmartId: 4447291, preco: 19.90, nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', imagem: '/img/bump-exclusiva.webp', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.' },
    ],
    bumps: [
      {
        id: 'limp', flag: 'limp', hotmartId: 5959285, preco: 9.90, de: 58.70, imagem: '/img/bump-ouro.webp',
        nome: 'Ouro Automotivo — 30 Fórmulas', titulo: 'Ouro Automotivo — 30 Fórmulas de Produtos Automotivos Profissionais',
        desc: 'Aumente sua linha de produtos sem comprar outro curso: 30 fórmulas profissionais de estética automotiva, no mesmo padrão da Fábrica da Limpeza, prontas para produzir e vender aos mesmos clientes.',
      },
      {
        id: 'form', flag: 'form', hotmartId: 4447291, preco: 19.90, de: 121.37, imagem: '/img/bump-exclusiva.webp',
        nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.',
        desc: 'Conte o que você precisa e receba de 3 a 5 fórmulas criadas por um especialista só para o seu negócio. Prazo de até 5 dias úteis.',
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
    clarityId: 'yvjxh5bqh2',
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
      { id: 'limp', flag: 'limp', hotmartId: 7927216, preco: 13.90, nome: '50 Fórmulas de Limpeza', titulo: '50 Fórmulas de Limpeza — Expanda Sua Linha de Produtos', imagem: '/img/bump-50formulas.webp' },
      { id: 'leg', flag: 'leg', hotmartId: 7927079, preco: 13.90, nome: 'Guia de Legalização', titulo: 'Guia de Legalização — Venda Seus Produtos do Jeito Certo', imagem: '/img/bump-legalizacao-ap.webp' },
      { id: 'form', flag: 'form', hotmartId: 7927025, preco: 24.90, nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', imagem: '/img/bump-exclusiva.webp', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.' },
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
        desc: 'Conte o que você precisa e receba de 3 a 5 fórmulas criadas por um especialista só para o seu segmento. Prazo de até 5 dias úteis.',
      },
    ],
  },

  // ─── Funil "Essencial" (R$ 14,90): entrada barata + bumps + upgrade para a versão Completa pagando a diferença ───
  // Apps próprios (chaves Upstash próprias). Pixel/CAPI/Clarity reaproveitam os do produto original (pixelDe).
  // IDs 91xxxxx/92xxxxx são internos (cadastre em "ofertas" no dashboard).
  apess: {
    nome: 'Fórmula Auto Pro Essencial',
    preco: 14.90, hotmartId: 9100001,
    flag: 'base',
    redisPrefix: 'apess:',
    tokenPrefix: 'APE_',
    pixelDe: 'ap',
    clarityId: 'yvjxh5bqh2',
    appUrl: process.env.APP_URL_APESS || 'https://formulaautoessencial.luverisgroup.com.br/',
    emailFrom: 'Formula Auto Pro <noreply@mail.luverisgroup.com.br>',
    titulo: 'Fórmula Auto Pro Essencial — 20 Receitas de Produtos Automotivos Passo a Passo',
    imagem: '/img/apess.webp',
    cor: '#E8720C', bg: '#0D0F12', rodape: 'João Silva - Engenheiro Químico - Fórmula Auto Pro',
    // Oferta de upgrade (página de obrigado, e-mails e app): 60 fórmulas a mais pagando só a diferença, com prazo real de janelaH horas.
    upsell: {
      nome: 'Fórmula Auto Pro Completa', credito: 14.90, janelaH: 72, fTotal: 80, fMais: 60, linha: 'automotivas',
      kicker: 'Uma opção para ampliar o que você acabou de adquirir',
      titulo: 'Passe de 20 para 80 fórmulas automotivas por mais R$ 27.',
      h2: 'O que você recebe com a ampliação:',
      lead2: 'São <b>60 fórmulas adicionais</b>, além de recursos para organizar seus produtos e planejar preços.',
      extra: 'O acesso completo também inclui PDF para download, glossário de insumos, lista de fornecedores, precificação automática e suporte direto com João Silva, Engenheiro Químico.',
      lead: 'Você já garantiu sua seleção inicial com o Essencial. Se quer mais opções de produtos para desenvolver sua linha automotiva, pode ampliar agora para a Fórmula Auto Pro Completa.',
      bullets: [
        '<b>80 fórmulas profissionais no total:</b> mais opções de shampoos, ceras, polimentos, limpeza, proteção e aromatização.',
        '<b>Gerador de rótulo com IA:</b> crie modelos para organizar e apresentar as informações dos seus produtos.',
        '<b>Gerador de ficha técnica:</b> reúna as informações das fórmulas em documentos para consulta.',
        '<b>Calculadora de lucro:</b> simule receitas e custos para planejar sua produção e seus preços.',
      ],
      cta: 'Sim, quero a Completa',
    },
    depoimentos: [],
    avulsos: [
      { id: 'limp', flag: 'limp', hotmartId: 7927216, preco: 9.90, nome: '50 Fórmulas de Limpeza', titulo: '50 Fórmulas de Limpeza — Expanda Sua Linha de Produtos', imagem: '/img/bump-50formulas.webp' },
      { id: 'leg', flag: 'leg', hotmartId: 7927079, preco: 6.90, nome: 'Guia de Legalização', titulo: 'Guia de Legalização — Venda Seus Produtos do Jeito Certo', imagem: '/img/bump-legalizacao-ap.webp' },
      { id: 'form', flag: 'form', hotmartId: 7927025, preco: 24.90, nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', imagem: '/img/bump-exclusiva.webp', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.' },
      // Upgrade: libera o Essencial como "Completa" (flag upg) e dá acesso à base do app completo (chave cliente:).
      { id: 'upg', flag: 'upg', tambem: { produto: 'ap', flag: 'base' }, hotmartId: 9100004, preco: 27.00, precoCheio: 41.90, janelaH: 72, nome: 'Upgrade para a Fórmula Auto Pro Completa', titulo: 'Upgrade — Fórmula Auto Pro Completa (80 fórmulas)', imagem: '/img/ap.webp', appUrl: 'https://formulaauto.luverisgroup.com.br/' },
    ],
    bumps: [
      {
        id: 'limp', flag: 'limp', hotmartId: 7927216, preco: 9.90, de: 24.70, imagem: '/img/bump-50formulas.webp',
        nome: '50 Fórmulas de Limpeza', titulo: '50 Fórmulas de Limpeza — Expanda Sua Linha de Produtos',
        desc: 'Seu cliente já compra produtos de limpeza. Falta comprar de você.\nAmplie sua linha com 50 fórmulas de limpeza: sabão líquido, amaciante, alvejante, desengordurante, produtos para pisos e linha industrial. Além dos produtos para o carro, ofereça opções para a casa e o negócio do mesmo cliente.',
        cta: 'Sim, quero adicionar as 50 fórmulas de limpeza!',
      },
      {
        id: 'leg', flag: 'leg', hotmartId: 7927079, preco: 6.90, de: 17.20, imagem: '/img/bump-legalizacao-ap.webp',
        nome: 'Guia de Legalização', titulo: 'Guia de Legalização — Venda Seus Produtos do Jeito Certo',
        desc: 'Vai fabricar para vender? Entenda como regularizar seu negócio.\nDúvidas sobre rótulos e registros podem gerar erros e retrabalho. Adicione o Guia de Legalização e conheça as orientações sobre rotulagem, registros e etapas de regularização para planejar sua produção e venda com mais clareza.',
        cta: 'Sim, quero incluir o Guia de Legalização!',
      },
    ],
  },
  fdless: {
    nome: 'Fábrica da Limpeza Essencial',
    preco: 14.90, hotmartId: 9200001,
    flag: 'base',
    redisPrefix: 'fdless:',
    tokenPrefix: 'FES_',
    pixelDe: 'fdl',
    clarityId: 'yvjzyrj5l5',
    appUrl: process.env.APP_URL_FDLESS || 'https://fabricadalimpezaessencial.luverisgroup.com.br/',
    emailFrom: 'Fábrica da Limpeza <noreply@mail.luverisgroup.com.br>',
    titulo: 'Fábrica da Limpeza Essencial — 20 Receitas de Produtos de Limpeza Passo a Passo',
    imagem: '/img/fdless.webp',
    cor: '#3A8A4E', bg: '#0D1410', rodape: 'João Silva - Engenheiro Químico - Fábrica da Limpeza',
    // Oferta de upgrade (página de obrigado, e-mails e app): 180 fórmulas a mais pagando só a diferença, com prazo real de janelaH horas.
    upsell: {
      nome: 'Fábrica da Limpeza Premium', credito: 14.90, janelaH: 72, fTotal: 200, fMais: 180, linha: 'de limpeza',
      kicker: 'Amplie seu acesso com o crédito da compra do Essencial',
      titulo: 'Passe de 20 para 200 fórmulas de limpeza por mais R$ 22,10.',
      h2: 'Mais opções de produtos e apoio para sua produção',
      lead: 'Você já garantiu sua seleção inicial com o Essencial. Com a Fábrica da Limpeza Premium, acrescenta 180 fórmulas para estudar novos produtos e ampliar as opções da sua linha.',
      lead2: 'Além do catálogo maior, você recebe recursos para organizar rótulos, fichas técnicas e o planejamento dos seus resultados.',
      extra: 'O acesso completo também inclui PDF para download, glossário de 61 insumos, lista de fornecedores de insumos e embalagens com abrangência nacional, precificação e suporte direto com João Silva, Engenheiro Químico.',
      bullets: [
        '<b>200 fórmulas profissionais em sete categorias:</b> amplie suas opções com ingredientes, proporções e preparo explicado.',
        '<b>50 Receitas Caseiras:</b> explore mais opções de preparos para o dia a dia.',
        '<b>20 fórmulas da Linha Especial Premium:</b> opções como perfumador de ambiente, linen spray, neutralizador de odor pet e limpa-colchão.',
        '<b>Gerador de modelo de rótulo com IA, ficha técnica e calculadora de resultados:</b> organize informações dos produtos e compare receitas e despesas do seu planejamento.',
      ],
      cta: 'Sim, quero a Premium',
    },
    depoimentos: [],
    avulsos: [
      { id: 'limp', flag: 'limp', hotmartId: 5959285, preco: 9.90, nome: 'Ouro Automotivo — 30 Fórmulas', titulo: 'Ouro Automotivo — 30 Fórmulas de Produtos Automotivos Profissionais', imagem: '/img/avulso-ouro.webp' },
      { id: 'perf', flag: 'perf', hotmartId: 5959154, preco: 6.90, nome: 'Perfumes de Casa de Rico', titulo: 'Perfumes de Casa de Rico', imagem: '/img/avulso-perfumes.webp' },
      { id: 'leg', flag: 'leg', hotmartId: 6000725, preco: 6.90, nome: 'Guia de Legalização Rápida', titulo: 'Guia de Legalização Rápida', imagem: '/img/avulso-legalizacao-fdl.webp' },
      { id: 'form', flag: 'form', hotmartId: 4447291, preco: 24.90, nome: 'Fórmula Exclusiva', titulo: 'Fórmula Exclusiva — Receitas Criadas Para o Seu Negócio', imagem: '/img/bump-exclusiva.webp', whatsapp: 'Ola Joao! Comprei a Formula Exclusiva.' },
      { id: 'upg', flag: 'upg', tambem: { produto: 'fdl', flag: 'base' }, hotmartId: 9200005, preco: 22.10, precoCheio: 37.00, janelaH: 72, nome: 'Upgrade para a Fábrica da Limpeza Premium', titulo: 'Upgrade — Fábrica da Limpeza Premium (200 fórmulas)', imagem: '/img/fdl.webp', appUrl: 'https://fabricadalimpeza.luverisgroup.com.br/' },
    ],
    bumps: [
      {
        id: 'perf', flag: 'perf', hotmartId: 5959154, preco: 6.90, de: 16.90, imagem: '/img/avulso-perfumes.webp',
        nome: 'Perfumes de Casa de Rico', titulo: 'Perfumes de Casa de Rico',
        desc: 'Além de limpar, ofereça o perfume que valoriza o ambiente.\nAdicione o Perfumes de Casa de Rico e aprenda a produzir fragrâncias como Oud Real, Rosa Negra e Chocolate Belga. Cada receita traz os valores de custo e venda para ajudar você a precificar e ampliar sua linha com perfumação para ambientes.',
        cta: 'Sim, quero adicionar os perfumes para ambientes!',
      },
      {
        id: 'leg', flag: 'leg', hotmartId: 6000725, preco: 6.90, de: 17.20, imagem: '/img/avulso-legalizacao-fdl.webp',
        nome: 'Guia de Legalização Rápida', titulo: 'Guia de Legalização Rápida',
        desc: 'Vai fabricar para vender? Entenda como regularizar seu negócio.\nDúvidas sobre rótulos e registros podem gerar erros e retrabalho. Adicione o Guia de Legalização e conheça as orientações sobre rotulagem, registros e etapas de regularização para planejar sua produção e venda com mais clareza.',
        cta: 'Sim, quero incluir o Guia de Legalização!',
      },
      {
        id: 'limp', flag: 'limp', hotmartId: 5959285, preco: 9.90, de: 24.70, imagem: '/img/bump-ouro.webp',
        nome: 'Ouro Automotivo — 30 Fórmulas', titulo: 'Ouro Automotivo — 30 Fórmulas de Produtos Automotivos Profissionais',
        desc: 'Seu cliente de limpeza também tem carro. Amplie sua oferta.\nAdicione o Ouro Automotivo e aprenda a fabricar snow foam, cera de carnaúba, cristalizador, limpa rodas e limpa couro. Complemente sua linha de limpeza com produtos automotivos e tenha mais opções para oferecer a quem já compra de você.',
        cta: 'Sim, quero incluir as fórmulas automotivas!',
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

// Venda que também mexe em OUTRO app (upgrade): { produto: <objeto do catálogo>, flag } ou null.
export function alvoExtra(reg) {
  const p = PRODUTOS[reg.produto];
  const a = reg.avulso ? (p?.avulsos || []).find((x) => x.id === reg.avulso) : null;
  const t = a?.tambem && PRODUTOS[a.tambem.produto];
  return t ? { produto: t, flag: a.tambem.flag } : null;
}
// Chave das variáveis de ambiente (pixel/CAPI): o funil Essencial usa as do produto original.
export const envId = (id) => String(PRODUTOS[id]?.pixelDe || id).toUpperCase();

export function calcular(produtoId, bumpIds = [], saida = false, avulsoId = '', precoAvulso = null) {
  const p = PRODUTOS[produtoId];
  if (!p) return null;
  if (avulsoId) {
    // Link avulso: só o item pedido, com o preço do servidor (sem desconto de saída nem bumps).
    const a = (p.avulsos || []).find((x) => x.id === avulsoId);
    if (!a) return null;
    const centavos = Math.round(precoItem(precoAvulso != null ? precoAvulso : a.preco) * 100);
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
