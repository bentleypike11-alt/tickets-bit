const { Ticket, TicketType, GuildSettings } = require('../../database/models');
const { closeTicket } = require('./tickets');
async function runAutoClose(client) {
  const now=Date.now();
  const tickets=await Ticket.find({status:'open',lastMessageAt:{$exists:true,$lt:new Date(now-60*60*1000)}}).limit(100);
  for(const ticket of tickets){
    const type=await TicketType.findOne({_id:ticket.typeId,guildId:ticket.guildId});
    const settings=await GuildSettings.findOne({guildId:ticket.guildId});
    if(!type?.autoClose?.enabled && !settings?.autoCloseEnabled) continue;
    const hours=Number(type?.autoClose?.inactiveHours||24);
    if(ticket.lastMessageAt.getTime()>now-hours*3600000) continue;
    const guild=client.guilds.cache.get(ticket.guildId); if(!guild) continue;
    try{await closeTicket({guild,ticket,actor:client.user,reason:type?.autoClose?.closeMessage||'Automatically closed due to inactivity.'});}catch(e){console.error('[AutoClose]',ticket.ticketId,e.message)}
  }
}
module.exports={runAutoClose};
