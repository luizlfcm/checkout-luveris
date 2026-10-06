// Upstash Redis REST (mesmo banco dos apps).
const URL_ = () => process.env.KV_REST_API_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN;

export async function cmd(args) {
  const r = await fetch(URL_(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.result;
}

// Merge atômico: um produto não apaga o outro (n8n, webhook Hotmart e este checkout convivem).
const LUA = `
local v = redis.call('GET', KEYS[1])
local c
if v then
  c = cjson.decode(v)
else
  c = { token = ARGV[3], nome = ARGV[2], email = ARGV[4], base = false, limp = false, leg = false, form = false, perf = false, criadoEm = ARGV[6] }
end
if not c.token then c.token = ARGV[3] end
if not c.criadoEm then c.criadoEm = ARGV[6] end
if ARGV[2] ~= '' and (c.nome == nil or c.nome == '' or c.nome == 'Cliente') then c.nome = ARGV[2] end
c.email = ARGV[4]
c[ARGV[1]] = (ARGV[5] == '1')
c.atualizadoEm = ARGV[6]
redis.call('SET', KEYS[1], cjson.encode(c))
return 1
`;

function agora() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
function gerarToken(prefix) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let t = prefix;
  for (let i = 0; i < 12; i++) t += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return t;
}

export async function setFlag(produto, email, nome, flag, ligar) {
  return cmd(['EVAL', LUA, '1', `${produto.redisPrefix}${email}`,
    flag, nome || '', gerarToken(produto.tokenPrefix), email, ligar ? '1' : '0', agora()]);
}
