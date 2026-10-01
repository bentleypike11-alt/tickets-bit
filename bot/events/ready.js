const { register } = require('../commands/register');
module.exports = async client => { console.log(`[Discord] Logged in as ${client.user.tag}`); client.user.setPresence({ activities: [{ name: 'Managing Tickets', type: 3 }], status: 'online' }); await register(client); };
