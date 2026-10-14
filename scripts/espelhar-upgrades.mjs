// Corrige clientes que JÁ fizeram upgrade (Essencial -> Completa): copia os extras do Essencial para o app Completa.
// Uso:  KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/espelhar-upgrades.mjs          (só mostra o que faria)
//       KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/espelhar-upgrades.mjs --aplicar (grava)
//       ... --email cliente@email.com   (limita a um cliente)
import { cmd } from '../api/_lib/redis.js';
import { PRODUTOS } from '../api/_lib/produtos.js';
import { espelharNoCompleto, FLAGS_ESPELHADAS, produtoCompleto } from '../api/_lib/espelho.js';

const aplicar = process.argv.includes('--aplicar');
const i = process.argv.indexOf('--email');
const so = i > 0 ? process.argv[i + 1].toLowerCase() : null;

for (const [id, prod] of Object.entries(PRODUTOS)) {
  const destino = produtoCompleto(prod);
  if (!destino) continue;
  let cursor = '0', vistos = 0, upg = 0, faltam = 0;
  do {
    const [prox, chaves] = await cmd(['SCAN', cursor, 'MATCH', `${prod.redisPrefix}${so || '*'}`, 'COUNT', '500']);
    cursor = prox;
    for (const k of chaves) {
      vistos++;
      const c = JSON.parse((await cmd(['GET', k])) || '{}');
      if (!c.upg) continue;
      upg++;
      const email = k.slice(prod.redisPrefix.length);
      const d = JSON.parse((await cmd(['GET', `${destino.redisPrefix}${email}`])) || '{}');
      const lista = FLAGS_ESPELHADAS.filter((f) => c[f] && !d[f]);
      if (!lista.length) continue;
      faltam++;
      console.log(`${id}: ${email} -> faltam na Completa: ${lista.join(', ')}`);
      if (aplicar) await espelharNoCompleto(prod, { produto: id, email, nome: c.nome, avulso: 'upg' }, true);
    }
  } while (cursor !== '0');
  console.log(`[${id}] clientes: ${vistos} | com upgrade: ${upg} | precisando de ajuste: ${faltam}${aplicar ? ' (aplicado)' : ' (simulação, use --aplicar)'}`);
}
