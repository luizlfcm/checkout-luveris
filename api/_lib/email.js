// E-mails via Resend (mesmo visual/remetente dos fluxos do n8n).
// Só envia se RESEND_API_KEY estiver configurada. Falhas nunca derrubam a liberação.
import { PRODUTOS } from './produtos.js';

const WA = 'https://wa.me/558131963052';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function moldura(p, titulo, subtitulo, miolo) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:${p.bg};padding:32px;text-align:center;border-radius:16px 16px 0 0;border-top:4px solid ${p.cor}">
<h1 style="color:${p.cor};font-size:22px;margin:8px 0 4px">${esc(titulo)}</h1>
<p style="color:#aaa;font-size:13px;margin:0">${esc(subtitulo)}</p></td></tr>
<tr><td style="background:#111418;padding:32px">${miolo}
<p style="color:#8b95a1;font-size:12px;margin-top:24px">Dúvidas? <a href="${WA}" style="color:${p.cor}">WhatsApp: (81) 3196-3052</a></p>
</td></tr>
<tr><td style="background:#080B0F;padding:16px;text-align:center;border-radius:0 0 16px 16px">
<p style="color:#4a5568;font-size:11px;margin:0">${esc(p.rodape)}</p></td></tr>
</table></td></tr></table></body></html>`;
}

async function resend(p, to, subject, html, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { enviado: false, motivo: 'resend não configurado' };
  const body = { from: process.env.EMAIL_FROM || p.emailFrom, to: [to], subject, html, text };
  if (process.env.EMAIL_REPLY_TO) body.reply_to = process.env.EMAIL_REPLY_TO;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) { console.error('resend falhou', r.status, await r.text().catch(() => '')); return { enviado: false, motivo: `HTTP ${r.status}` }; }
  return { enviado: true };
}

export async function enviarEntrega(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p) return { enviado: false, motivo: 'produto desconhecido' };
  const extras = p.bumps.filter((b) => (reg.bumps || []).includes(b.id));
  const comApp = [p.nome, ...extras.filter((b) => !b.whatsapp).map((b) => b.nome)];
  const comZap = extras.filter((b) => b.whatsapp);

  let miolo = `<p style="color:#f2f4f6;font-size:16px">Olá!</p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Seu pagamento foi confirmado. Você comprou:</p>
<ul style="color:#f2f4f6;font-size:15px;line-height:1.6">${[p.nome, ...extras.map((b) => b.nome)].map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Para acessar, toque no botão abaixo e faça login com este e-mail:</p>
<div style="background:#1a1f26;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
<p style="color:#aaa;font-size:12px;margin:0 0 6px">Seu e-mail de acesso</p>
<p style="color:#fff;font-size:18px;font-weight:700;margin:0">${esc(reg.email)}</p></div>
<p style="color:#8b95a1;font-size:13px">Este e-mail é sua chave de acesso. Guarde-o com cuidado.</p>
<div style="text-align:center;margin:28px 0"><a href="${esc(p.appUrl)}" style="display:inline-block;background:${p.cor};color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Acessar agora</a></div>`;
  for (const b of comZap) {
    miolo += `<div style="border-top:1px solid #1e2530;padding-top:20px;margin-top:8px">
<p style="color:#f2f4f6;font-size:15px"><b>${esc(b.nome)}</b></p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Seu pedido foi confirmado! Entre em contato pelo WhatsApp para enviar as informações e iniciamos o desenvolvimento.</p>
<div style="text-align:center;margin:20px 0"><a href="${WA}?text=${encodeURIComponent(b.whatsapp)}" style="display:inline-block;background:#25D366;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Enviar mensagem no WhatsApp</a></div></div>`;
  }
  miolo += `<p style="color:#8b95a1;font-size:13px">🛡️ Você tem 30 dias de garantia.</p>`;

  const text = `Olá! Seu pagamento foi confirmado (${[p.nome, ...extras.map((b) => b.nome)].join(', ')}).\n` +
    `Acesse ${p.appUrl} e faça login com o e-mail: ${reg.email}\n` +
    comZap.map((b) => `\n${b.nome}: envie as informações pelo WhatsApp ${WA}\n`).join('') +
    '\n30 dias de garantia. Dúvidas? WhatsApp: (81) 3196-3052';
  const titulo = 'Acesso Liberado!';
  void comApp;
  return resend(p, reg.email, `${p.nome} - Acesso liberado!`, moldura(p, titulo, p.nome, miolo), text);
}

export async function enviarReembolso(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p) return { enviado: false, motivo: 'produto desconhecido' };
  const miolo = `<p style="color:#f2f4f6;font-size:16px">Olá!</p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Seu reembolso de <strong>${esc(p.nome)}</strong> foi processado com sucesso. O acesso ao produto foi encerrado conforme solicitado.</p>
<div style="background:#1a1f26;border-radius:10px;padding:14px;border-left:3px solid ${p.cor};margin-top:20px">
<p style="color:#8b95a1;font-size:13px;margin:0">Se mudou de ideia ou tem alguma dúvida, entre em contato:<br><a href="${WA}" style="color:${p.cor}">WhatsApp: (81) 3196-3052</a></p></div>`;
  const text = `Olá! Seu reembolso de ${p.nome} foi processado. Dúvidas? WhatsApp: (81) 3196-3052`;
  return resend(p, reg.email, `Reembolso confirmado — ${p.nome}`, moldura(p, 'Reembolso Confirmado', p.nome, miolo), text);
}
