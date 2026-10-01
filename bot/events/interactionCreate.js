const { TicketType, TicketPanel } = require('../../database/models');
const { createTicket } = require('../services/tickets');
const { handleTicket, handleButton, setup } = require('../commands/handlers');
const { panelContainer, row, button, v2 } = require('../utils/components');
module.exports = async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'setup') return setup(interaction);
      if (interaction.commandName === 'ticket') return handleTicket(interaction);
      if (interaction.commandName === 'ticket-panel') return interaction.reply(v2(panelContainer({title:'Ticket Panel',description:'Create and publish panels from the Ticket Bot dashboard.'})));
    }
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('open:')) {
        const typeId=interaction.customId.split(':')[1]; await interaction.deferReply({flags:64}); const result=await createTicket({guild:interaction.guild,user:interaction.user,typeId}); return interaction.editReply(v2(panelContainer({title:'Ticket created',description:`Your ticket has been created: ${result.channel}` ,rows:[row([button(`ticket:close:${result.ticket.ticketId}`,'Close','Danger')])]}))); }
      return handleButton(interaction);
    }
  } catch (err) {
    console.error('[Interaction]', err);
    const payload=v2(panelContainer({title:'Something went wrong',description:err.message || 'An unexpected error occurred.'}));
    if (interaction.deferred || interaction.replied) return interaction.editReply(payload).catch(()=>{});
    return interaction.reply({...payload, flags:64}).catch(()=>{});
  }
};
