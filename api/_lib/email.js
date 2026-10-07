// E-mail de entrega via Resend. Só envia se RESEND_API_KEY e EMAIL_FROM estiverem
// configuradas; qualquer falha é registrada e NUNCA atrapalha a liberação do acesso.
import { PRODUTOS } from './produtos.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function enviarEntrega(reg) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { enviado: false, motivo: 'resend não configurado' };

  const p = PRODUTOS[reg.produto];
  if (!p) return { enviado: false, motivo: 'produto desconhecido' };
  const extras = p.bumps.filter((b) => (reg.bumps || []).includes(b.id));
  const comInstrucoes = extras.filter((b) => b.instrucoes);

  const linhasItens = [p.nome, ...extras.map((b) => b.nome)];
  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#14181f">
<div style="max-width:560px;margin:0 auto;padding:20px">
 <div style="background:#fff;border-radius:14px;padding:24px;font-size:18px;line-height:1.5">
  <h1 style="font-size:22px;margin:0 0 12px">Pagamento confirmado! ✅</h1>
  <p>Seu acesso já está liberado. Você comprou:</p>
  <ul style="padding-left:20px">${linhasItens.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
  <p><b>Como entrar:</b></p>
  <ol style="padding-left:20px">
   <li>Toque no botão abaixo para abrir o aplicativo</li>
   <li>Entre com este e-mail: <b>${esc(reg.email)}</b></li>
  </ol>
  <p style="text-align:center;margin:24px 0"><a href="${esc(p.appUrl)}" style="background:#16a34a;color:#fff;text-decoration:none;font-weight:bold;padding:16px 28px;border-radius:12px;display:inline-block">Abrir meu aplicativo</a></p>
  ${comInstrucoes.map((b) => `<hr style="border:0;border-top:1px solid #d5dae1;margin:20px 0"><p><b>${esc(b.nome)}</b></p><p style="white-space:pre-line">${esc(b.instrucoes)}</p>`).join('')}
  <hr style="border:0;border-top:1px solid #d5dae1;margin:20px 0">
  <p style="font-size:15px;color:#566070">🛡️ Você tem 30 dias de garantia. Se precisar de ajuda, é só responder este e-mail.</p>
 </div>
</div></body></html>`;
  const text = `Pagamento confirmado!\n\nVocê comprou: ${linhasItens.join(', ')}\n\nAbra o aplicativo: ${p.appUrl}\nEntre com este e-mail: ${reg.email}\n` +
    comInstrucoes.map((b) => `\n${b.nome}\n${b.instrucoes}\n`).join('') + '\n30 dias de garantia. Dúvidas? Responda este e-mail.';

  const body = { from, to: [reg.email], subject: `Seu acesso está liberado — ${p.nome}`, html, text };
  if (process.env.EMAIL_REPLY_TO) body.reply_to = process.env.EMAIL_REPLY_TO;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) { console.error('resend falhou', r.status, await r.text().catch(() => '')); return { enviado: false, motivo: `HTTP ${r.status}` }; }
  return { enviado: true };
}
