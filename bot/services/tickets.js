const crypto = require('crypto');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { Ticket, TicketType, TicketCounter, GuildSettings, Transcript, StaffMember } = require('../../database/models');
const { generateTranscript } = require('../../transcripts/generator');
const { logAction } = require('./logging');

async function nextNumber(guildId) {
  const c = await TicketCounter.findOneAndUpdate({ guildId }, { $inc: { value: 1 } }, { new: true, upsert: true });
  return c.value;
}
function applyName(format, { username, userid, ticketid, type, number }) {
  return (format || 'ticket-{number}').replaceAll('{username}', username).replaceAll('{userid}', userid).replaceAll('{ticketid}', ticketid).replaceAll('{type}', type.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replaceAll('{number}', String(number).padStart(3, '0')).slice(0, 90);
}
async function createTicket({ guild, user, typeId, panelId }) {
  const type = await TicketType.findOne({ _id: typeId, guildId: guild.id, enabled: true });
  if (!type) throw new Error('This ticket type is unavailable.');
  const settings = await GuildSettings.findOne({ guildId: guild.id }) || await GuildSettings.create({ guildId: guild.id });
  if (settings.maxOpenTicketsPerUser > 0) {
    const count = await Ticket.countDocuments({ guildId: guild.id, creatorId: user.id, status: 'open' });
    if (count >= settings.maxOpenTicketsPerUser) throw new Error('You have reached the maximum number of open tickets.');
  }
  if (settings.ticketCooldownSeconds > 0) {
    const recent = await Ticket.findOne({ guildId: guild.id, creatorId: user.id }).sort({ createdAt: -1 });
    if (recent && Date.now() - recent.createdAt.getTime() < settings.ticketCooldownSeconds * 1000) throw new Error('You are on a ticket creation cooldown.');
  }
  const number = await nextNumber(guild.id);
  const ticketId = crypto.randomBytes(6).toString('hex');
  const name = applyName(type.namingFormat, { username: user.username, userid: user.id, ticketid: ticketId, type: type.name, number });
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }
  ];
  for (const roleId of type.supportRoleIds || []) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] });
  const channel = await guild.channels.create({ name, type: ChannelType.GuildText, parent: type.categoryId || settings.defaultCategoryId || null, permissionOverwrites: overwrites, topic: `Ticket Bot | ${ticketId} | ${type.name}` });
  const ticket = await Ticket.create({ guildId: guild.id, ticketId, number, channelId: channel.id, typeId: type.id, typeName: type.name, creatorId: user.id, creatorTag: user.tag || user.username, name, participantIds: [user.id], lastMessageAt: new Date() });
  await logAction({ guild, action: 'Ticket Created', actor: user, ticketId, metadata: { type: type.name, panelId } });
  await sendWelcome(channel, ticket, type, settings);
  return { ticket, channel, type };
}
async function sendWelcome(channel, ticket, type, settings) {
  const { panelContainer, row, button, v2, emoji } = require('../utils/components');
  const rows = [row([
    button(`ticket:claim:${ticket.ticketId}`, 'Claim', 'Success'), button(`ticket:close:${ticket.ticketId}`, 'Close', 'Danger'), button(`ticket:lock:${ticket.ticketId}`, 'Lock', 'Secondary'), button(`ticket:transcript:${ticket.ticketId}`, 'Transcript', 'Secondary')
  ])];
  const welcome = type.welcomeMessage || settings.branding?.welcomeMessage || 'Thank you for contacting support. A member of our team will assist you shortly.';
  const ticketEmoji = await emoji(ticket.guildId, 'ticket');
  await channel.send(v2(panelContainer({ title: `${ticketEmoji} ${type.name} Ticket`, description: `${welcome}\n\nTicket ID: \`${ticket.ticketId}\`\nStatus: Open\n\nUse the controls below for common ticket actions.` , rows })));
}
async function closeTicket({ guild, ticket, actor, reason = 'No reason provided.' }) {
  const channel = guild.channels.cache.get(ticket.channelId) || await guild.channels.fetch(ticket.channelId).catch(() => null);
  if (!channel) throw new Error('Ticket channel no longer exists.');
  await channel.permissionOverwrites.edit(ticket.creatorId, { SendMessages: false });
  const html = await generateTranscript({ guild, channel, ticket, reason });
  const publicId = crypto.randomBytes(18).toString('base64url');
  const settings = await GuildSettings.findOne({ guildId: guild.id }) || {};
  const transcript = await Transcript.create({ guildId: guild.id, ticketId: ticket.ticketId, publicId, ticketName: ticket.name, creatorId: ticket.creatorId, creatorTag: ticket.creatorTag, claimerId: ticket.claimerId, createdAt: ticket.createdAt, closedAt: new Date(), closeReason: reason, visibility: settings.transcriptVisibility || 'public', html, messageCount: (html.match(/class="message"/g) || []).length });
  ticket.status = 'closed'; ticket.closedAt = new Date(); ticket.closeReason = reason; await ticket.save();
  await logAction({ guild, action: 'Ticket Closed', actor, ticketId: ticket.ticketId, metadata: { reason, transcript: publicId } });
  if (settings.transcriptChannelId) {
    const logChannel = guild.channels.cache.get(settings.transcriptChannelId) || await guild.channels.fetch(settings.transcriptChannelId).catch(() => null);
    if (logChannel?.isTextBased()) await logChannel.send(`Ticket transcript generated for **${ticket.name}**: ${process.env.TRANSCRIPT_URL || ''}/transcript/${publicId}`);
  }
  return transcript;
}
async function reopenTicket({ guild, ticket, actor }) {
  const channel = guild.channels.cache.get(ticket.channelId) || await guild.channels.fetch(ticket.channelId).catch(() => null);
  if (!channel) throw new Error('Ticket channel no longer exists.');
  await channel.permissionOverwrites.edit(ticket.creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
  ticket.status = 'open'; ticket.closedAt = undefined; await ticket.save();
  await logAction({ guild, action: 'Ticket Reopened', actor, ticketId: ticket.ticketId });
}
module.exports = { createTicket, closeTicket, reopenTicket, applyName };
