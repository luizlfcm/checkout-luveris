// E-mails via Resend (mesmo visual/remetente dos fluxos do n8n).
// Só envia se RESEND_API_KEY estiver configurada. Falhas nunca derrubam a liberação.
import { createHash } from 'crypto';
import { PRODUTOS } from './produtos.js';

const WA = 'https://wa.me/558131963052';
const CONTATO = 'contato@luverisgroup.com.br';
const BASE = 'https://pagamento.luverisgroup.com.br';
const LOGO = `${BASE}/img/luveris-logo.jpg`;
// "MARIA DA SILVA" -> "Maria"
const primeiroNome = (n) => { const w = String(n || '').trim().split(/\s+/)[0] || ''; return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''; };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function moldura(p, titulo, subtitulo, miolo, suporte = true, zapTexto = '') {
  const bloco = suporte ? `<div style="background:#1a1f26;border-radius:12px;padding:20px;text-align:center;margin-top:28px">
<p style="color:#f2f4f6;font-size:15px;margin:0 0 6px">💬 <b>Dúvidas técnicas? Fale direto com o especialista (João Silva)</b></p>
<p style="color:#8b95a1;font-size:13px;margin:0 0 14px">WhatsApp: (81) 3196-3052</p>
<a href="${WA}?text=${encodeURIComponent(zapTexto || `Olá João! Comprei o ${p.nome} e tenho uma dúvida.`)}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Chamar no WhatsApp</a></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:${p.bg};padding:32px;text-align:center;border-radius:16px 16px 0 0;border-top:4px solid ${p.cor}">
<h1 style="color:${p.cor};font-size:22px;margin:8px 0 4px">${esc(titulo)}</h1>
<p style="color:#aaa;font-size:13px;margin:0">${esc(subtitulo)}</p></td></tr>
<tr><td style="background:#111418;padding:32px">${miolo}${bloco}</td></tr>
<tr><td style="background:#080B0F;padding:24px 16px;text-align:center;border-radius:0 0 16px 16px">
<p style="color:#f2f4f6;font-size:15px;font-weight:700;margin:0 0 2px">Responsável técnico: João Silva</p>
<p style="color:#aab3bd;font-size:12px;margin:0 0 20px">Engenheiro Químico · responsável pelo conteúdo de ${esc(p.nome)}</p>
<img src="${LOGO}" width="76" height="76" alt="Luveris Mídia" style="display:block;margin:0 auto 8px;border-radius:10px">
<p style="color:#6b7683;font-size:10.5px;line-height:1.6;margin:0">53.168.292 LUIZ FELIPE CORREA MIRANDA · CNPJ 53.168.292/0001-32<br>
${suporte ? 'Garantia de 30 dias · ' : ''}Reembolso, pagamento e demais assuntos:<br>
<a href="mailto:${CONTATO}" style="color:#6b7683">${CONTATO}</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

async function resend(p, to, subject, html, text, agendarEm = '') {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { enviado: false, motivo: 'resend não configurado' };
  const body = { from: process.env.EMAIL_FROM || p.emailFrom, to: [to], subject, html, text };
  body.reply_to = process.env.EMAIL_REPLY_TO || CONTATO;
  if (agendarEm) body.scheduled_at = agendarEm; // ISO 8601; o Resend aceita até 30 dias à frente
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) { console.error('resend falhou', r.status, await r.text().catch(() => '')); return { enviado: false, motivo: `HTTP ${r.status}` }; }
  const j = await r.json().catch(() => ({}));
  return { enviado: true, id: j.id || '' };
}

export async function enviarEntrega(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p) return { enviado: false, motivo: 'produto desconhecido' };
  const av = reg.avulso ? (p.avulsos || []).find((a) => a.id === reg.avulso) : null; // compra avulsa (link dentro do app)
  const extras = av ? [] : p.bumps.filter((b) => (reg.bumps || []).includes(b.id));
  const comprados = av ? [av.nome] : [p.nome, ...extras.map((b) => b.nome)];
  const comApp = av ? (av.whatsapp ? [] : [av.nome]) : [p.nome, ...extras.filter((b) => !b.whatsapp).map((b) => b.nome)];
  const comZap = av ? (av.whatsapp ? [av] : []) : extras.filter((b) => b.whatsapp);
  const soZap = !!(av && av.whatsapp); // entrega manual: sem botão do app

  const nomeCli = primeiroNome(reg.nome);
  const appUrl = (av && av.appUrl) || p.appUrl;
  let miolo = `<p style="color:#f2f4f6;font-size:16px">Olá${nomeCli ? ', ' + esc(nomeCli) : ''}!</p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Seu pagamento foi confirmado. Você comprou:</p>
<ul style="color:#f2f4f6;font-size:15px;line-height:1.6">${comprados.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
${soZap ? '' : `<p style="color:#8b95a1;font-size:14px;line-height:1.7">Para acessar, toque no botão abaixo e faça login com este e-mail:</p>
<div style="background:#1a1f26;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
<p style="color:#aaa;font-size:12px;margin:0 0 6px">Seu e-mail de acesso</p>
<p style="color:#fff;font-size:18px;font-weight:700;margin:0">${esc(reg.email)}</p></div>
<p style="color:#8b95a1;font-size:13px">Este e-mail é sua chave de acesso. Guarde-o com cuidado.</p>
<div style="text-align:center;margin:28px 0"><a href="${esc(appUrl)}" style="display:inline-block;background:${p.cor};color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Acessar agora</a></div>`}`;
  for (const b of comZap) {
    miolo += `<div style="border-top:1px solid #1e2530;padding-top:20px;margin-top:8px">
<p style="color:#f2f4f6;font-size:15px"><b>${esc(b.nome)}</b></p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Seu pedido foi confirmado! Entre em contato pelo WhatsApp para enviar as informações e iniciamos o desenvolvimento.</p>
<div style="text-align:center;margin:20px 0"><a href="${WA}?text=${encodeURIComponent(b.whatsapp)}" style="display:inline-block;background:#25D366;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Enviar mensagem no WhatsApp</a></div></div>`;
  }
  miolo += `<p style="color:#8b95a1;font-size:13px">🛡️ Você tem 30 dias de garantia.</p>`;
  if (!av && p.upsell) miolo += blocoUpsell(p, reg, Date.now() + (upgDe(p).janelaH || 72) * 3600 * 1000, 'upg_entrega');

  const text = `Olá${nomeCli ? ', ' + nomeCli : ''}! Seu pagamento foi confirmado (${comprados.join(', ')}).\n` +
    (soZap ? '' : `Acesse ${appUrl} e faça login com o e-mail: ${reg.email}\n`) +
    (!av && p.upsell ? textoUpsell(p, reg, Date.now() + (upgDe(p).janelaH || 72) * 3600 * 1000, 'upg_entrega') : '') +
    comZap.map((b) => `\n${b.nome}: envie as informações pelo WhatsApp ${WA}\n`).join('') +
    `\n30 dias de garantia. Dúvidas técnicas: WhatsApp do especialista (João Silva) (81) 3196-3052. Reembolso e demais assuntos: ${CONTATO}.\nResponsável técnico: João Silva - 53.168.292 LUIZ FELIPE CORREA MIRANDA - CNPJ 53.168.292/0001-32`;
  const titulo = 'Acesso Liberado!';
  void comApp;
  return resend(p, reg.email, `${av ? av.nome : p.nome} - Acesso liberado!`, moldura(p, titulo, av ? av.nome : p.nome, miolo), text);
}

export async function enviarReembolso(reg) {
  const p = PRODUTOS[reg.produto];
  if (!p) return { enviado: false, motivo: 'produto desconhecido' };
  const nomeCli = primeiroNome(reg.nome);
  const nomeCompra = (reg.avulso && (p.avulsos || []).find((a) => a.id === reg.avulso)?.nome) || p.nome;
  const miolo = `<p style="color:#f2f4f6;font-size:16px">Olá${nomeCli ? ', ' + esc(nomeCli) : ''}!</p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Seu reembolso de <strong>${esc(nomeCompra)}</strong> foi processado com sucesso. O acesso ao produto foi encerrado conforme solicitado.</p>
<div style="background:#1a1f26;border-radius:10px;padding:14px;border-left:3px solid ${p.cor};margin-top:20px">
<p style="color:#8b95a1;font-size:13px;margin:0">Se mudou de ideia ou tem alguma dúvida, responda este e-mail ou escreva para <a href="mailto:${CONTATO}" style="color:${p.cor}">${CONTATO}</a>.</p></div>`;
  const text = `Olá! Seu reembolso de ${nomeCompra} foi processado. Dúvidas? Responda este e-mail (${CONTATO}).`;
  return resend(p, reg.email, `Reembolso confirmado — ${nomeCompra}`, moldura(p, 'Reembolso Confirmado', nomeCompra, miolo, false), text);
}

// ---------- Recuperação de vendas (Pix pendente / cartão recusado) ----------
// Token do link "não quero mais lembretes" (impede que terceiros bloqueiem e-mails alheios).
export function tokenParar(email) {
  const seg = process.env.RECUPERACAO_SEGREDO || process.env.MP_WEBHOOK_SECRET || process.env.RESEND_API_KEY || '';
  return createHash('sha256').update(`${seg}|${String(email).toLowerCase()}`).digest('hex').slice(0, 24);
}
const urlParar = (email) => `${BASE}/api/parar?e=${encodeURIComponent(email)}&t=${tokenParar(email)}`;
const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


// ---------- Upgrade Essencial -> Completa (bloco na entrega + e-mails do dia 1 e do dia 3) ----------
const brl2 = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const quandoBR = (ms) => {
  const d = new Date(ms);
  const dia = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
};
const linkUpg = (reg, campanha) => `${BASE}/${reg.produto}/upg?email=${encodeURIComponent(reg.email)}&utm_source=email&utm_medium=email&utm_campaign=${campanha}`;
const upgDe = (p) => (p.avulsos || []).find((a) => a.id === 'upg');

function blocoUpsell(p, reg, expiraEm, campanha, comTitulo = true) {
  const u = p.upsell, a = upgDe(p);
  const lis = u.bullets.map((b) => `<li style="margin:0 0 8px">${b}</li>`).join('');
  return `<div style="border:2px solid ${p.cor};border-radius:14px;padding:22px 18px;margin:28px 0 8px;background:#0f1318">
${comTitulo ? `<p style="color:${p.cor};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px">${esc(u.kicker)}</p>
<p style="color:#fff;font-size:20px;font-weight:800;line-height:1.25;margin:0 0 10px">${esc(u.titulo)}</p>
<p style="color:#aab3bd;font-size:14px;line-height:1.7;margin:0 0 14px">${esc(u.lead)}</p>` : ''}
<ul style="color:#e6ebf0;font-size:14px;line-height:1.55;padding-left:20px;margin:0 0 16px">${lis}</ul>
<div style="background:#1a1f26;border-radius:10px;padding:14px;text-align:center;margin:0 0 14px">
<p style="color:#aab3bd;font-size:13px;margin:0 0 4px">${esc(u.nome)}: <s>${brl2(a.precoCheio)}</s> menos seu crédito de ${brl2(u.credito)}</p>
<p style="color:${p.cor};font-size:34px;font-weight:900;margin:0">${brl2(a.preco)}</p>
<p style="color:#8b95a1;font-size:12px;margin:4px 0 0">pagamento único · garantia de 30 dias</p></div>
<div style="text-align:center"><a href="${esc(linkUpg(reg, campanha))}" style="display:inline-block;background:${p.cor};color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-weight:800;font-size:15px">${esc(u.cta)} por ${brl2(a.preco)} →</a></div>
<p style="color:#8b95a1;font-size:12px;line-height:1.6;text-align:center;margin:12px 0 0">⏳ Seu crédito vale até <b style="color:#e6ebf0">${esc(quandoBR(expiraEm))}</b>. Depois disso, a ${esc(u.nome)} volta a ${brl2(a.precoCheio)}.</p></div>`;
}
const textoUpsell = (p, reg, expiraEm, campanha) => {
  const u = p.upsell, a = upgDe(p);
  return `\n${u.titulo}\n${u.nome} por ${brl2(a.preco)} (crédito do Essencial já descontado; preço cheio ${brl2(a.precoCheio)}). Vale até ${quandoBR(expiraEm)}.\n${linkUpg(reg, campanha)}\n`;
};

// tipo: 'd1' (1 dia depois) ou 'd3' (6h antes de a janela fechar). Agendado no Resend; cancelado se a pessoa comprar/parar.
export async function enviarUpsell(reg, tipo, { agendarEm = '', expiraEm = 0 } = {}) {
  const p = PRODUTOS[reg.produto];
  if (!p?.upsell) return { enviado: false, motivo: 'sem upsell' };
  const a = upgDe(p), u = p.upsell;
  const nomeCli = primeiroNome(reg.nome);
  const ola = `<p style="color:#f2f4f6;font-size:16px">Olá${nomeCli ? ', ' + esc(nomeCli) : ''}!</p>`;
  const entrada = reg.produto === 'apess' ? 'Shampoo Automotivo Neutro (o de maior volume de venda da linha automotiva)' : 'Multiuso Tradicional (o produto mais vendido em qualquer linha de limpeza)';
  const parar = `<p style="color:#8b95a1;font-size:12px;line-height:1.6;margin-top:24px">Não quer mais receber mensagens sobre esta oferta? <a href="${esc(urlParar(reg.email))}" style="color:#8b95a1">Clique aqui para parar</a>.</p>`;
  let assunto, titulo, miolo, texto;
  if (tipo === 'd1') {
    assunto = 'Já fez sua primeira receita? (e um convite)'; titulo = 'Como está indo?';
    miolo = `${ola}<p style="color:#8b95a1;font-size:14px;line-height:1.7">Ontem você entrou no ${esc(p.nome)}. Um conselho de quem formula há mais de 10 anos: <b style="color:#fff">comece pequeno</b>. Faça um lote de teste de 1 litro com a receita de entrada, <b style="color:#fff">${esc(entrada)}</b>, e siga a ordem do modo de preparo. Foi assim que a maioria dos produtores começou.</p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">E um lembrete: o seu crédito de ${brl2(u.credito)} para a ${esc(u.nome)} segue valendo.</p>${blocoUpsell(p, reg, expiraEm, 'upg_d1', false)}${parar}`;
    texto = `Olá${nomeCli ? ', ' + nomeCli : ''}! Como está indo? Comece com um lote de teste de 1 litro da receita de entrada: ${entrada}.${textoUpsell(p, reg, expiraEm, 'upg_d1')}Para parar de receber: ${urlParar(reg.email)}`;
  } else {
    assunto = `Seu crédito de ${brl2(u.credito)} termina hoje`; titulo = 'Última chamada do seu crédito';
    miolo = `${ola}<p style="color:#8b95a1;font-size:14px;line-height:1.7">Só um aviso rápido: <b style="color:#fff">seu crédito de ${brl2(u.credito)} termina hoje, às ${esc(new Date(expiraEm).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))}</b>. Depois disso, a ${esc(u.nome)} volta ao preço cheio de ${brl2(a.precoCheio)}.</p>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Se você pretende vender de verdade, a linha completa é o que faz diferença: mais fórmulas, mais tipos de cliente e as ferramentas para precificar e rotular.</p>${blocoUpsell(p, reg, expiraEm, 'upg_d3', false)}${parar}`;
    texto = `Olá${nomeCli ? ', ' + nomeCli : ''}! Seu crédito de ${brl2(u.credito)} termina hoje. Depois, a ${u.nome} volta a ${brl2(a.precoCheio)}.${textoUpsell(p, reg, expiraEm, 'upg_d3')}Para parar de receber: ${urlParar(reg.email)}`;
  }
  return resend(p, reg.email, assunto, moldura(p, titulo, p.nome, miolo, true, `Olá João! Tenho uma dúvida sobre a ${u.nome}.`), texto, agendarEm);
}

// tipo: 'pix1' (Pix gerado e não pago), 'pix2' (dia seguinte), 'cartao' (pagamento recusado)
export async function enviarRecuperacao(reg, tipo, { pix = '', agendarEm = '' } = {}) {
  const p = PRODUTOS[reg.produto];
  if (!p) return { enviado: false, motivo: 'produto desconhecido' };
  const nomeCli = primeiroNome(reg.nome);
  const link = `${BASE}/${reg.produto}?utm_source=recuperacao&utm_medium=email&utm_campaign=${tipo}`;
  const olaP = `<p style="color:#f2f4f6;font-size:16px">Olá${nomeCli ? ', ' + esc(nomeCli) : ''}!</p>`;
  const botao = (rotulo) => `<div style="text-align:center;margin:28px 0"><a href="${esc(link)}" style="display:inline-block;background:${p.cor};color:#fff;padding:16px 30px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">${rotulo}</a></div>`;
  const rodape = `<p style="color:#8b95a1;font-size:12px;line-height:1.6;margin-top:24px">Se você já pagou, é só desconsiderar este e-mail. Não quer mais receber lembretes? <a href="${esc(urlParar(reg.email))}" style="color:#8b95a1">Toque aqui para parar</a>.</p>`;
  let assunto, titulo, miolo, texto;
  if (tipo === 'pix1' && pix) {
    assunto = `Seu Pix está esperando — ${p.nome}`; titulo = 'Seu Pix está esperando';
    miolo = `${olaP}<p style="color:#8b95a1;font-size:14px;line-height:1.7">Você gerou o Pix de <b style="color:#fff">${brl(reg.valor)}</b> para <b style="color:#fff">${esc(p.nome)}</b>, mas ainda não vimos o pagamento. O código abaixo vale por mais um tempo. Copie e cole no app do seu banco (Pix Copia e Cola):</p>
<div style="background:#1a1f26;border-radius:10px;padding:14px;margin:16px 0;word-break:break-all;color:#fff;font-size:13px;line-height:1.5;font-family:monospace">${esc(pix)}</div>
<p style="color:#8b95a1;font-size:14px;line-height:1.7">Se o código expirou, é só gerar outro:</p>${botao('Abrir o pagamento')}${rodape}`;
    texto = `Olá${nomeCli ? ', ' + nomeCli : ''}! Seu Pix de ${brl(reg.valor)} para ${p.nome} ainda não foi pago. Pix Copia e Cola:\n${pix}\nSe expirou, gere outro: ${link}\nSe já pagou, desconsidere. Para parar: ${urlParar(reg.email)}`;
  } else if (tipo === 'pix2' || tipo === 'pix1') {
    assunto = `Ainda dá tempo — ${p.nome}`; titulo = 'Ainda dá tempo de garantir';
    miolo = `${olaP}<p style="color:#8b95a1;font-size:14px;line-height:1.7">Ontem você começou a comprar <b style="color:#fff">${esc(p.nome)}</b>, mas o Pix não foi concluído. Ele expirou, mas você pode gerar um novo em segundos, e o acesso é liberado na hora, com 30 dias de garantia.</p>${botao('Gerar um novo Pix')}${rodape}`;
    texto = `Olá${nomeCli ? ', ' + nomeCli : ''}! O Pix de ${p.nome} expirou, mas você pode gerar outro: ${link}\nSe já pagou, desconsidere. Para parar: ${urlParar(reg.email)}`;
  } else {
    assunto = `Seu pagamento não foi aprovado — ${p.nome}`; titulo = 'Seu pagamento não foi aprovado';
    miolo = `${olaP}<p style="color:#8b95a1;font-size:14px;line-height:1.7">Não conseguimos aprovar o pagamento de <b style="color:#fff">${esc(p.nome)}</b> no cartão. Isso pode acontecer por limite, por algum dado digitado errado ou por uma trava do banco. Você pode tentar de novo ou pagar por <b style="color:#fff">Pix</b>, que é aprovado na hora.</p>${botao('Tentar novamente')}${rodape}`;
    texto = `Olá${nomeCli ? ', ' + nomeCli : ''}! Não conseguimos aprovar o pagamento de ${p.nome} no cartão. Tente de novo ou pague por Pix: ${link}\nSe já pagou, desconsidere. Para parar: ${urlParar(reg.email)}`;
  }
  return resend(p, reg.email, assunto, moldura(p, titulo, p.nome, miolo, true, `Olá João! Tentei comprar o ${p.nome} e preciso de ajuda.`), texto, agendarEm);
}
