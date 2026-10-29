# checkout-luveris

Checkout próprio (Mercado Pago · API de Orders) para Fábrica da Limpeza (`/fdl`) e Fórmula Auto Pro (`/ap`).
Pix só com e-mail; cartão pede CPF. Libera acesso direto no Upstash (mesmo formato dos apps).

## Variáveis de ambiente (Vercel)
- `MP_ACCESS_TOKEN` — Access Token (teste primeiro; depois produção)
- `MP_PUBLIC_KEY` — Public Key (teste/produção, mesmo ambiente do token)
- `MP_WEBHOOK_SECRET` — assinatura secreta do webhook (painel do Mercado Pago)
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Upstash (token de escrita)
- Opcionais: `META_PIXEL_ID` (ou `META_PIXEL_ID_FDL` / `META_PIXEL_ID_AP`), `META_CAPI_TOKEN_FDL` / `META_CAPI_TOKEN_AP` (ou `META_CAPI_TOKEN`), `META_TEST_CODE_FDL` / `META_TEST_CODE_AP` (ou `META_TEST_CODE`, só para testes no Gerenciador de Eventos)

## Webhook no Mercado Pago
URL: `https://<dominio>/api/mp-webhook` · evento: Order (Orders)

## Order bumps
Edite `bumps` em `api/_lib/produtos.js`.
- Teste de preço: `PRECO_TESTE_CENTAVOS` (ex.: 100 = R$ 1,00 por item). REMOVER após o teste.
- Recuperação de vendas (LIGADA por padrão, todos os produtos e também links avulsos/upgrade): Pix pendente → e-mail após ~25 min (com o código) + lembrete no dia seguinte; cartão recusado → e-mail após ~15 min. `RECUPERACAO=0` desliga tudo; `RECUPERACAO_DIA2=0` desliga só o do dia seguinte. Usa o agendamento do Resend e cancela se o cliente pagar. Link "parar" em `/api/parar` (opcional: `RECUPERACAO_SEGREDO`). Vendas recuperadas vão marcadas ao dashboard.
- Parcelamento no cartão: `MAX_PARCELAS` (padrão 3). Juros por conta do comprador, definidos pelo Mercado Pago; o preço do produto não muda.
- Pop-up de saída: preço em `precoSaida` (api/_lib/produtos.js), imagem em `imagemSaida`; desconto só no produto principal.
- Reabrir o preço do upgrade para um cliente que perdeu as 72 h: página `/admin-upgrade.html` (API `/api/reabrir-upgrade`), protegida pela variável `ADMIN_KEY`. Só reabre para quem tem o Essencial e ainda não fez o upgrade; não reenvia e-mails.
- Dashboard: `DASHBOARD_URL` e `DASHBOARD_WEBHOOK_SECRET` (mesmo valor de CHECKOUT_WEBHOOK_SECRET no dashboard). Não envia em modo de teste.
- Status dos pedidos para a aba "Checkout" do dashboard: a cada mudança (Pix gerado, aprovado, recusado, expirado, cancelado, reembolsado) o checkout envia `ORDER_STATUS` ao dashboard (mesmas variáveis `DASHBOARD_URL` e `DASHBOARD_WEBHOOK_SECRET`; não envia em modo de teste). Se o envio falhar, a próxima consulta do pedido tenta de novo.
- Cabeçalho "🔥 N ofertas exclusivas para você" no bloco dos bumps: ligado por padrão (`CHECKOUT_EXCLUSIVAS=0` volta ao "Aproveite e compre junto:").
- Bloco "O que dizem os alunos" (DESLIGADO por padrão): `CHECKOUT_DEPOIMENTOS=1` liga. Os textos ficam em `depoimentos` de cada produto em `api/_lib/produtos.js` (sem nomes, fotos ou telefones; só ortografia ajustada). Só use texto de mensagens reais e autorizadas.

## Links de pagamento avulsos (itens vendidos dentro dos apps)
`/fdl/{limp|perf|leg|form}` e `/ap/{limp|leg|form}` cobram só aquele item (preços em `avulsos` de `api/_lib/produtos.js`).
Opcional: `?email=...&nome=...` pré-preenche os dados. Sem pixel/CAPI de compra (ligue com `CAPI_AVULSOS=1`) e sem e-mails de recuperação.
Itens com `whatsapp` (form) são entregues manualmente: o e-mail e a tela de sucesso levam ao WhatsApp. O comprador deve usar o MESMO e-mail do login no app.
O dashboard precisa ter os IDs Hotmart do item na tabela `ofertas` (senão o webhook falha por chave estrangeira).

## Funil Essencial (R$ 14,90) — `/apess` e `/fdless`
Produtos `apess` (Fórmula Auto Pro Essencial) e `fdless` (Fábrica da Limpeza Essencial) em `api/_lib/produtos.js`.
- Apps próprios (repos `app-auto-pro-essencial` / `app-fabrica-da-limpeza-essencial`), chaves Upstash `apess:<email>` / `fdless:<email>`.
- Bumps: AP = 50 Fórmulas de Limpeza (9,90) + Guia de Legalização (6,90); FDL = Perfumes (6,90) + Legalização (6,90) + Ouro Automotivo (9,90).
- Links dos itens bloqueados dentro do app: `/apess/limp`, `/apess/leg`, `/fdless/limp|perf|leg`. Upgrade para a Completa (paga a diferença): `/apess/upg` (R$ 22,10) e `/fdless/upg` (R$ 22,10): grava `upg` no Essencial **e** `base` no app completo (`cliente:` / `fdl_cliente:`); reembolso remove os dois.
- Pixel/CAPI/Clarity reaproveitam os do produto original (`pixelDe`): não precisa criar variáveis novas. URL dos apps: `APP_URL_APESS` / `APP_URL_FDLESS` (padrão `formulaautoessencial.` / `fabricadalimpezaessencial.luverisgroup.com.br`).
- IDs de oferta no dashboard: só Front e Upsell são novos (AP: 9100001 front, 9100004 upg; FDL: 9200001 front, 9200005 upg). Os order bumps reaproveitam os IDs que já existem (AP: 7927216 limp, 7927079 leg; FDL: 5959285 Ouro, 5959154 perfumes, 6000725 leg). SQL em `dashboard/migrations/2026-10-ofertas-essencial.sql`.

### Upgrade com janela de 72 h (Essencial → Completa)
- Ao confirmar o pagamento do Essencial abre-se a janela (`chk_upg:<produto>:<email>`): dentro de 72 h o upgrade custa R$ 22,10 (AP e FDL); depois, o preço cheio da Completa (R$ 37,00 nas duas). O preço é sempre calculado no servidor (`api/_lib/upgrade.js`); `GET /api/upgrade?p=apess&email=` informa preço e prazo ao app.
- Página de obrigado do Essencial mostra o acesso e a oferta (textos em `upsell` de cada produto, com contagem regressiva real).
- E-mails: bloco do upgrade no e-mail de entrega + e-mail do dia 1 (24 h) + do dia 3 (66 h, 6 h antes de fechar), agendados no Resend e cancelados se a pessoa comprar o upgrade, pedir reembolso ou clicar em "parar" (mesmo link da recuperação). `UPSELL_EMAILS=0` desliga os e-mails.
- Faixa de Black Friday no topo de todos os checkouts (liga sozinha, some depois de 30/11/2026). `BLACKFRIDAY=0` desliga; `BLACKFRIDAY_ATE` (ISO, ex.: `2026-12-02T23:59:59-03:00`) muda a data final. Mostra "de R$ X por R$ Y" só nos produtos com `bf: { de }` em `produtos.js` (hoje só o Premium); nos demais, texto neutro (sem prometer desconto).
- Cupom na recuperação do Pix (só Premium `fdl` e Auto Pro `ap`, config `cupomRec` em `produtos.js`): a sequência do Pix passa a ter um 3º e-mail, o último, 72 h depois de gerar o Pix e não pagar ("Última oportunidade"), com `RECUPERACAO_PCT`% de desconto (padrão 20) no produto principal, válido 24 h. O prazo é real: o servidor (`api/_lib/cupomrec.js`) só aplica o desconto para aquele e-mail entre o envio e o fim da validade, em `config.js` e `pagar.js`; bumps ficam a preço normal. A compra cancela o e-mail e apaga o cupom. `RECUPERACAO_CUPOM=0` desliga só esse 3º e-mail. Cartão recusado e itens avulsos não entram.
- Pós-venda do produto principal sem upgrade (Premium `fdl` e Auto Pro `ap`, config `posVenda` + `pacote` em `produtos.js`): e-mail em 24 h oferecendo o Ouro/50 Fórmulas (preço normal), e **cupom do pacote**: no dia 3 (72 h) e na reta final (108 h) o cliente recebe `PACOTE_PCT`% (padrão 30) de desconto em TODOS os itens que ainda não tem (só os que faltam; Ouro e/ou Fórmula Exclusiva), válido por 120 h a partir da compra. Link `/<produto>/pacote?email=...`; o servidor decide o que falta e o preço (`api/_lib/pacote.js`), só vale para quem já é cliente e dentro do prazo (depois cobra preço normal). Se a pessoa comprar um item avulso no meio do caminho, os e-mails do cupom são refeitos só com o que sobrou; comprar o pacote cancela tudo. Cancelados também se pedir reembolso ou clicar em "parar". `POSVENDA_EMAILS=0` desliga os e-mails; `PACOTE_PCT` muda o desconto (0–90). No dashboard a venda aparece com a etiqueta "Pacote (cupom)".
