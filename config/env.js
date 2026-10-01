require('dotenv').config();

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'MONGODB_URI', 'SESSION_SECRET'];
for (const key of required) {
  if (!process.env[key]) console.warn(`[Config] Missing ${key}. Some features will not start until it is configured.`);
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
  mongoUri: process.env.MONGODB_URI,
  sessionSecret: process.env.SESSION_SECRET || 'development-only-secret',
  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
  transcriptUrl: process.env.TRANSCRIPT_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  cookieSecure: process.env.COOKIE_SECURE === 'true'
};
