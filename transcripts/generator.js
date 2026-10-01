function escapeHtml(value = '') { return String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
async function collectMessages(channel) {
  const all = [];
  let before;
  for (let i = 0; i < 20; i++) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch?.size) break;
    all.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }
  return all.sort((a,b) => a.createdTimestamp - b.createdTimestamp);
}
async function generateTranscript({ guild, channel, ticket, reason }) {
  const messages = await collectMessages(channel);
  const rows = messages.map(m => {
    const attachments = [...m.attachments.values()].map(a => `<div class="attachment"><a href="${escapeHtml(a.url)}" target="_blank" rel="noreferrer">${escapeHtml(a.name || 'Attachment')}</a></div>`).join('');
    const content = escapeHtml(m.content || '').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
    return `<div class="message"><img class="avatar" src="${escapeHtml(m.author.displayAvatarURL({ extension: 'png', size: 64 }))}"><div><div class="meta"><strong>${escapeHtml(m.author.tag)}</strong><span>${new Date(m.createdTimestamp).toLocaleString()}</span>${m.editedTimestamp ? '<span>edited</span>' : ''}</div><div class="content">${content}</div>${attachments}</div></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(ticket.name)} - Ticket Bot Transcript</title><style>body{margin:0;background:#08070b;color:#eee;font:15px Inter,system-ui,sans-serif}.wrap{max-width:1100px;margin:auto;padding:28px}.brand{display:flex;gap:14px;align-items:center}.brand img{width:52px;height:52px;border-radius:14px}.card{background:#111018;border:1px solid #282331;border-radius:18px;padding:20px;margin-top:20px}.meta{display:flex;gap:10px;align-items:center;color:#a9a5b4}.meta strong{color:#fff}.message{display:flex;gap:12px;padding:16px 0;border-bottom:1px solid #211e29}.message:last-child{border:0}.avatar{width:40px;height:40px;border-radius:50%}.content{white-space:pre-wrap;line-height:1.55;margin-top:5px}.content a,.attachment a{color:#b78cff}.pill{display:inline-block;padding:5px 9px;border-radius:999px;background:#22153d;color:#c9a7ff;margin:3px}</style></head><body><main class="wrap"><div class="brand"><img src="/assets/ticket-bot-logo.png"><div><h1>Ticket Bot Transcript</h1><div>${escapeHtml(guild.name)} · ${escapeHtml(ticket.name)}</div></div></div><div class="card"><div><span class="pill">Ticket ${escapeHtml(ticket.ticketId)}</span><span class="pill">Created ${new Date(ticket.createdAt).toLocaleString()}</span><span class="pill">Closed ${new Date().toLocaleString()}</span></div><p><strong>Creator:</strong> ${escapeHtml(ticket.creatorTag || ticket.creatorId)}</p><p><strong>Closing reason:</strong> ${escapeHtml(reason)}</p></div><div class="card">${rows || '<p>No messages were recorded.</p>'}</div></main></body></html>`;
}
module.exports = { generateTranscript };
