const { Ticket } = require('../../database/models');
module.exports = async message => {
  if (!message.guild || message.author.bot) return;
  const ticket=await Ticket.findOne({guildId:message.guild.id,channelId:message.channel.id,status:'open'});
  if (ticket) { ticket.lastMessageAt=new Date(); await ticket.save(); }
};
