# checkout-luveris

Checkout próprio (Mercado Pago · API de Orders) para Fábrica da Limpeza (`/fdl`) e Fórmula Auto Pro (`/ap`).
Pix só com e-mail; cartão pede CPF. Libera acesso direto no Upstash (mesmo formato dos apps).

## Variáveis de ambiente (Vercel)
- `MP_ACCESS_TOKEN` — Access Token (teste primeiro; depois produção)
- `MP_PUBLIC_KEY` — Public Key (teste/produção, mesmo ambiente do token)
- `MP_WEBHOOK_SECRET` — assinatura secreta do webhook (painel do Mercado Pago)
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Upstash (token de escrita)
- Opcionais: `META_PIXEL_ID` (ou `META_PIXEL_ID_FDL` / `META_PIXEL_ID_AP`), `META_CAPI_TOKEN_FDL` / `META_CAPI_TOKEN_AP` (ou `META_CAPI_TOKEN`), `META_TEST_CODE` (só para testes no Gerenciador de Eventos)

## Webhook no Mercado Pago
URL: `https://<dominio>/api/mp-webhook` · evento: Order (Orders)

## Order bumps
Edite `bumps` em `api/_lib/produtos.js`.
- Teste de preço: `PRECO_TESTE_CENTAVOS` (ex.: 100 = R$ 1,00 por item). REMOVER após o teste.
- Pop-up de saída: preço em `precoSaida` (api/_lib/produtos.js), imagem em `imagemSaida`; desconto só no produto principal.
