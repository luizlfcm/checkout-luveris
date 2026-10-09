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
- Recuperação de vendas (DESLIGADA por padrão): `RECUPERACAO=1` liga os lembretes por e-mail (Pix pendente após ~25 min; cartão recusado após ~15 min); `RECUPERACAO_DIA2=1` adiciona o lembrete do dia seguinte. Usa o agendamento do Resend e cancela se o cliente pagar. Link "parar" em `/api/parar` (opcional: `RECUPERACAO_SEGREDO`). Vendas recuperadas vão marcadas ao dashboard.
- Parcelamento no cartão: `MAX_PARCELAS` (padrão 3). Juros por conta do comprador, definidos pelo Mercado Pago; o preço do produto não muda.
- Pop-up de saída: preço em `precoSaida` (api/_lib/produtos.js), imagem em `imagemSaida`; desconto só no produto principal.
- Dashboard: `DASHBOARD_URL` e `DASHBOARD_WEBHOOK_SECRET` (mesmo valor de CHECKOUT_WEBHOOK_SECRET no dashboard). Não envia em modo de teste.
- Status dos pedidos para a aba "Checkout" do dashboard: a cada mudança (Pix gerado, aprovado, recusado, expirado, cancelado, reembolsado) o checkout envia `ORDER_STATUS` ao dashboard (mesmas variáveis `DASHBOARD_URL` e `DASHBOARD_WEBHOOK_SECRET`; não envia em modo de teste). Se o envio falhar, a próxima consulta do pedido tenta de novo.
- Visual novo do checkout (DESLIGADO por padrão): `CHECKOUT_V2=1` troca "Aproveite e compre junto:" por "🔥 N ofertas exclusivas para você" e mostra o bloco "O que dizem os alunos" com mensagens reais de alunos (textos em `depoimentos` de cada produto em `api/_lib/produtos.js`; sem nomes, fotos ou telefones; só ortografia ajustada). Só use texto de mensagens reais e autorizadas.

