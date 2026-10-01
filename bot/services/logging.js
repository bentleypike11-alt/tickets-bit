const { AuditLog } = require('../../database/models');
async function logAction({ guild, action, actor, ticketId, targetId, metadata = {} }) {
  await AuditLog.create({ guildId: guild.id, action, actorId: actor?.id, actorTag: actor?.tag || actor?.username, ticketId, targetId, metadata });
}
module.exports = { logAction };
