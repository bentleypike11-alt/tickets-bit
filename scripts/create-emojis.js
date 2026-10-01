const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { discordToken } = require('../config/env');
const { CustomEmoji } = require('../database/models');
const { connectDatabase } = require('../database/connection');

(async()=>{
  await connectDatabase();
  const client = new Client({ intents:[GatewayIntentBits.Guilds] });
  await client.login(discordToken);
  for (const guild of client.guilds.cache.values()) {
    for (const name of ['ticket','support','claim','close','lock','unlock','transcript','settings']) {
      if (guild.emojis.cache.find(e=>e.name===`tb_${name}`)) continue;
      const file=path.join(__dirname,'..','public','assets','emojis',`${name}.png`);
      try {
        const emoji=await guild.emojis.create({attachment:fs.createReadStream(file),name:`tb_${name}`});
        await CustomEmoji.findOneAndUpdate({guildId:guild.id,name},{emojiId:emoji.id,name,animated:false},{upsert:true,new:true});
        console.log(`[Emoji] ${guild.name}: :tb_${name}: ${emoji.id}`);
      } catch(e) { console.error(`[Emoji] ${guild.name} ${name}: ${e.message}`); }
    }
  }
  client.destroy(); process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
