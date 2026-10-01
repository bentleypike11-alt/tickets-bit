const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDatabase } = require('./database/connection');
const env = require('./config/env');
const { startDashboard } = require('./dashboard/server');

async function main() {
  await connectDatabase();
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel, Partials.Message] });
  client.once('ready', () => require('./bot/events/ready')(client));
  client.on('interactionCreate', i => require('./bot/events/interactionCreate')(i));
  client.on('messageCreate', m => require('./bot/events/messageCreate')(m));
  client.on('messageUpdate', (o,n) => require('./bot/events/messageUpdate')(o,n));
  client.on('messageDelete', m => require('./bot/events/messageDelete')(m));
  client.on('guildCreate', async guild => { const { register } = require('./bot/commands/register'); await register(client); });
  await client.login(env.discordToken);
  const { runAutoClose } = require('./bot/services/autoclose');
  setInterval(() => runAutoClose(client).catch(err => console.error('[AutoClose]', err)), 10 * 60 * 1000);

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(express.json({limit:'2mb'}));
  app.use(express.urlencoded({extended:true,limit:'2mb'}));
  app.use(session({ secret:env.sessionSecret, resave:false, saveUninitialized:false, store:MongoStore.create({mongoUrl:env.mongoUri}), cookie:{httpOnly:true,sameSite:'lax',secure:env.cookieSecure,maxAge:1000*60*60*24*7} }));
  app.use('/api', rateLimit({windowMs:60*1000,max:120,standardHeaders:true,legacyHeaders:false}));
  app.use(express.static(path.join(__dirname,'public')));
  app.use('/dashboard', express.static(path.join(__dirname,'dashboard/public')));
  startDashboard(app, client);
  app.listen(env.port,()=>console.log(`[Web] Ticket Bot dashboard listening on ${env.port}`));
}
main().catch(err=>{console.error('[Fatal]',err);process.exit(1)});
