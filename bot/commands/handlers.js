const { PermissionFlagsBits } = require('discord.js');
const { Ticket, TicketType, TicketPanel, GuildSettings } = require('../../database/models');
const { createTicket, closeTicket, reopenTicket } = require('../services/tickets');
const { canManageSettings, canManageTickets, getSettings } = require('../utils/permissions');
const { panelContainer, row, button, v2 } = require('../utils/components');
const { logAction } = require('../services/logging');
const { dashboardUrl } = require('../../config/env');

async function currentTicket(interaction) { return Ticket.findOne({ guildId: interaction.guildId, channelId: interaction.channelId }); }
async function reply(interaction, title, description, style = 'Primary') {
  const b = style === 'Success' ? button('noop', 'Done', 'Success', true) : null;
  return interaction.reply(v2(panelContainer({ title, description, rows: b ? [row([b])] : [] })));
}
async function setup(interaction) {
  if (!await canManageSettings(interaction.member, interaction.guildId)) return reply(interaction, 'Setup unavailable', 'You need Manage Server or a configured management role.');
  const settings = await getSettings(interaction.guildId);
  return interaction.reply(v2(panelContainer({ title: 'Ticket Bot Setup', description: `Configure your server from the dashboard.\n\nTicket Log Channel: ${settings.ticketLogChannelId ? `<#${settings.ticketLogChannelId}>` : 'Not configured'}\nTranscript Channel: ${settings.transcriptChannelId ? `<#${settings.transcriptChannelId}>` : 'Not configured'}\n\nUse the dashboard for panels, ticket types, permissions, branding, transcripts and settings.`, rows: [row([button(`${dashboardUrl}/dashboard`, 'Open Dashboard', 'Link')]) ]})));
}
async function handleTicket(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'panel' || sub === 'setup') return setup(interaction);
  const ticket = await currentTicket(interaction);
  if (!ticket) return reply(interaction, 'Not a ticket channel', 'This command can only be used inside a Ticket Bot ticket.');
  if (!await canManageTickets(interaction.member, interaction.guildId)) return reply(interaction, 'Permission denied', 'You do not have permission to manage this ticket.');
  if (sub === 'claim') {
    ticket.claimerId = interaction.user.id; await ticket.save(); await logAction({ guild: interaction.guild, action:'Ticket Claimed', actor:interaction.user, ticketId:ticket.ticketId });
    return reply(interaction, 'Ticket claimed', `This ticket is now claimed by ${interaction.user}.`, 'Success');
  }
  if (sub === 'unclaim') { ticket.claimerId = undefined; await ticket.save(); await logAction({guild:interaction.guild,action:'Ticket Unclaimed',actor:interaction.user,ticketId:ticket.ticketId}); return reply(interaction,'Ticket unclaimed','The ticket is available for staff to claim again.','Success'); }
  if (sub === 'rename') { const name = interaction.options.getString('name').replace(/[^a-z0-9-_]/gi,'-').slice(0,90); await interaction.channel.setName(name); ticket.name=name; await ticket.save(); await logAction({guild:interaction.guild,action:'Ticket Renamed',actor:interaction.user,ticketId:ticket.ticketId,metadata:{name}}); return reply(interaction,'Ticket renamed',`The ticket is now **${name}**.`,'Success'); }
  if (sub === 'add' || sub === 'remove') { const user=interaction.options.getUser('user'); await interaction.channel.permissionOverwrites.edit(user.id, sub==='add'?{ViewChannel:true,SendMessages:true,ReadMessageHistory:true}:{ViewChannel:false}); if(sub==='add') await Ticket.updateOne({_id:ticket._id},{$addToSet:{participantIds:user.id}}); await logAction({guild:interaction.guild,action:sub==='add'?'User Added':'User Removed',actor:interaction.user,targetId:user.id,ticketId:ticket.ticketId}); return reply(interaction,sub==='add'?'User added':'User removed',`${user} has been ${sub==='add'?'added to':'removed from'} the ticket.`,'Success'); }
  if (sub === 'close') { const reason=interaction.options.getString('reason')||'No reason provided.'; await interaction.deferReply(); const transcript=await closeTicket({guild:interaction.guild,ticket,actor:interaction.user,reason}); return interaction.editReply(v2(panelContainer({title:'Ticket closed',description:`The ticket has been closed and a transcript was generated.\n\nTranscript: ${dashboardUrl}/transcript/${transcript.publicId}`}))); }
  if (sub === 'reopen') { await reopenTicket({guild:interaction.guild,ticket,actor:interaction.user}); return reply(interaction,'Ticket reopened','The ticket has been reopened.','Success'); }
  if (sub === 'lock' || sub === 'unlock') { await interaction.channel.permissionOverwrites.edit(ticket.creatorId,{SendMessages:sub==='unlock'}); ticket.locked=sub==='lock'; await ticket.save(); await logAction({guild:interaction.guild,action:sub==='lock'?'Ticket Locked':'Ticket Unlocked',actor:interaction.user,ticketId:ticket.ticketId}); return reply(interaction,sub==='lock'?'Ticket locked':'Ticket unlocked',`The ticket is now ${sub==='lock'?'locked':'unlocked'}.`,'Success'); }
  if (sub === 'priority') { ticket.priority=interaction.options.getString('level'); await ticket.save(); await logAction({guild:interaction.guild,action:'Priority Changed',actor:interaction.user,ticketId:ticket.ticketId,metadata:{priority:ticket.priority}}); return reply(interaction,'Priority updated',`Priority is now **${ticket.priority}**.`,'Success'); }
  if (sub === 'transfer') { const user=interaction.options.getUser('user'); ticket.transferredTo=user.id; await ticket.save(); await logAction({guild:interaction.guild,action:'Ticket Transferred',actor:interaction.user,targetId:user.id,ticketId:ticket.ticketId}); return reply(interaction,'Ticket transferred',`Ticket responsibility was transferred to ${user}.`,'Success'); }
  if (sub === 'transcript') { await interaction.deferReply(); const { closeTicket } = require('../services/tickets'); const transcript = await require('../../transcripts/generator').generateTranscript({guild:interaction.guild,channel:interaction.channel,ticket,reason:ticket.closeReason||'Manual transcript'}); const crypto=require('crypto'); const { Transcript }=require('../../database/models'); const t=await Transcript.create({guildId:interaction.guildId,ticketId:ticket.ticketId,publicId:crypto.randomBytes(18).toString('base64url'),ticketName:ticket.name,creatorId:ticket.creatorId,creatorTag:ticket.creatorTag,claimerId:ticket.claimerId,createdAt:ticket.createdAt,closeReason:ticket.closeReason,html:transcript,messageCount:0}); return interaction.editReply(v2(panelContainer({title:'Transcript generated',description:`View transcript: ${dashboardUrl}/transcript/${t.publicId}`}))); }
}
async function handleButton(interaction) {
  const [scope, action, ticketId] = interaction.customId.split(':');
  if (scope !== 'ticket') return;
  const ticket = await Ticket.findOne({guildId:interaction.guildId,ticketId});
  if (!ticket) return reply(interaction,'Ticket not found','This ticket no longer exists.');
  if (!await canManageTickets(interaction.member, interaction.guildId) && action !== 'close') return reply(interaction,'Permission denied','You do not have permission to use this ticket control.');
  if (action === 'claim') { ticket.claimerId=interaction.user.id; await ticket.save(); return reply(interaction,'Ticket claimed',`Claimed by ${interaction.user}.`,'Success'); }
  if (action === 'close') { if(!await canManageTickets(interaction.member, interaction.guildId)) return reply(interaction,'Permission denied','Only staff can close tickets.'); await interaction.deferReply({flags:64}); const t=await closeTicket({guild:interaction.guild,ticket,actor:interaction.user,reason:'Closed from ticket control panel'}); return interaction.editReply(v2(panelContainer({title:'Ticket closed',description:`Transcript: ${dashboardUrl}/transcript/${t.publicId}`}))); }
  if (action === 'lock' || action === 'unlock') { await interaction.channel.permissionOverwrites.edit(ticket.creatorId,{SendMessages:action==='unlock'}); ticket.locked=action==='lock'; await ticket.save(); return reply(interaction,action==='lock'?'Ticket locked':'Ticket unlocked',`The ticket is now ${action==='lock'?'locked':'unlocked'}.`,'Success'); }
  if (action === 'transcript') { return interaction.reply(v2(panelContainer({title:'Transcript',description:`Use /ticket transcript to generate a transcript link.`}))); }
}
module.exports = { setup, handleTicket, handleButton };
