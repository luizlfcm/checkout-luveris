// GET /api/comunidade -> { url }  Endereço da Comunidade Luveris (env COMUNIDADE_URL). Vazio = comunidade desligada.
// Os apps usam isto para mostrar o convite só quando a comunidade estiver no ar.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  const url = String(process.env.COMUNIDADE_URL || '').trim().replace(/\/+$/, '');
  return res.status(200).json({ url: /^https:\/\//.test(url) ? url : '' });
}
