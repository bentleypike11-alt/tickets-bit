const { GuildSettings } = require('../../database/models');

function roleHas(member, ids = []) { return member?.roles?.cache?.some(r => ids.includes(r.id)); }
async function getSettings(guildId) { return GuildSettings.findOneAndUpdate({ guildId }, { $setOnInsert: { guildId } }, { new: true, upsert: true }); }
async function canManageGuild(member) { return Boolean(member?.permissions?.has('ManageGuild') || member?.permissions?.has('Administrator')); }
async function canStaff(member, guildId) {
  if (!member) return false;
  if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;
  const s = await getSettings(guildId);
  const p = s.permissions || {};
  return roleHas(member, [...(p.supportRoleIds || []), ...(p.managementRoleIds || []), ...(p.administratorRoleIds || [])]);
}
async function canManageTickets(member, guildId) {
  if (!member) return false;
  if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;
  const s = await getSettings(guildId);
  const p = s.permissions || {};
  return roleHas(member, [...(p.managementRoleIds || []), ...(p.administratorRoleIds || []), ...(p.supportRoleIds || [])]);
}
async function canManageSettings(member, guildId) {
  if (!member) return false;
  if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;
  const s = await getSettings(guildId);
  const p = s.permissions || {};
  return roleHas(member, [...(p.managementRoleIds || []), ...(p.administratorRoleIds || [])]);
}
module.exports = { getSettings, canManageGuild, canStaff, canManageTickets, canManageSettings, roleHas };
