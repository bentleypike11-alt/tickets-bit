const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { clientId, discordToken } = require('../../config/env');

function commands() {
  return [
    new SlashCommandBuilder().setName('setup').setDescription('Open the Ticket Bot setup panel.'),
    new SlashCommandBuilder().setName('ticket').setDescription('Manage a Ticket Bot ticket.')
      .addSubcommand(s => s.setName('add').setDescription('Add a user to this ticket.').addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true)))
      .addSubcommand(s => s.setName('remove').setDescription('Remove a user from this ticket.').addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true)))
      .addSubcommand(s => s.setName('rename').setDescription('Rename this ticket.').addStringOption(o => o.setName('name').setDescription('New channel name').setRequired(true)))
      .addSubcommand(s => s.setName('claim').setDescription('Claim this ticket.'))
      .addSubcommand(s => s.setName('unclaim').setDescription('Unclaim this ticket.'))
      .addSubcommand(s => s.setName('close').setDescription('Close this ticket.').addStringOption(o => o.setName('reason').setDescription('Closing reason').setRequired(false)))
      .addSubcommand(s => s.setName('reopen').setDescription('Reopen this ticket.'))
      .addSubcommand(s => s.setName('lock').setDescription('Lock this ticket.'))
      .addSubcommand(s => s.setName('unlock').setDescription('Unlock this ticket.'))
      .addSubcommand(s => s.setName('transcript').setDescription('Generate a transcript for this ticket.'))
      .addSubcommand(s => s.setName('priority').setDescription('Set ticket priority.').addStringOption(o => o.setName('level').setDescription('Priority').setRequired(true).addChoices({name:'Low',value:'low'},{name:'Normal',value:'normal'},{name:'High',value:'high'},{name:'Urgent',value:'urgent'})))
      .addSubcommand(s => s.setName('transfer').setDescription('Transfer the ticket to a user.').addUserOption(o => o.setName('user').setDescription('New responsible staff member').setRequired(true)))
      .addSubcommand(s => s.setName('panel').setDescription('Open the dashboard panel builder.'))
      .addSubcommand(s => s.setName('setup').setDescription('Open setup.')),
    new SlashCommandBuilder().setName('ticket-panel').setDescription('Post a Ticket Bot panel from the dashboard.')
  ].map(c => c.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild));
}
async function register(client) {
  const rest = new REST({ version: '10' }).setToken(discordToken);
  for (const guild of client.guilds.cache.values()) {
    await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commands().map(c => c.toJSON()) }).catch(err => console.error(`[Commands] ${guild.id}:`, err.message));
  }
  console.log(`[Commands] Registered for ${client.guilds.cache.size} guild(s).`);
}
module.exports = { register, commands };
