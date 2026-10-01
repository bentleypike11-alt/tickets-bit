# Ticket Bot

A free, full-featured Discord ticket platform built with Node.js 22+, discord.js v14, MongoDB/Mongoose and Express. It includes a Discord bot, server dashboard, REST API, transcript website, ticket panels, ticket types, staff permissions, logging, auto-close, server-specific branding, and custom emoji support.

## Important
- There is no premium system, billing, Stripe, subscriptions, or paid transcript feature.
- The uploaded Ticket Bot logo is stored at `public/assets/ticket-bot-logo.png` and is used throughout the app.
- Discord does not support a separate bot identity/presence per guild. Server-specific profile settings are therefore used for the dashboard, panels and transcripts rather than pretending Discord supports per-guild bot profiles.

## Requirements
- Node.js 22+
- MongoDB
- Discord application + bot
- A public HTTPS URL for production OAuth

## Install
```bash
npm install
cp .env.example .env
# fill in .env
npm start
```

## Discord Developer Portal
Create an application at the Discord Developer Portal. Add a bot and copy its token/client ID/client secret into `.env`.

OAuth2 redirect URI must exactly match `DISCORD_REDIRECT_URI`, for example:
`https://your-domain.com/auth/discord/callback`

OAuth scopes used by the dashboard: `identify guilds`.

Bot intents used:
- Guilds
- GuildMembers (needed for staff/member operations)
- GuildMessages
- MessageContent

Enable Message Content Intent and Server Members Intent in the Bot settings when your deployment uses those features.

Recommended bot permissions when inviting the bot:
- View Channels
- Send Messages
- Manage Channels
- Manage Messages
- Read Message History
- Attach Files
- Embed Links
- Manage Roles only if your configured workflow requires role changes
- Use Application Commands

Do not grant Administrator unless you intentionally want to.

## Dashboard
Visit `DASHBOARD_URL` and select **Login with Discord**. Only guilds returned by Discord where the user has `Manage Guild` or Administrator are shown.

The dashboard exposes settings, ticket types, panels, tickets, transcripts, logs, permissions, categories and server branding.

## Render
Create a Web Service from this repository.
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Add all `.env` values in Render Environment Variables.
- Use a MongoDB Atlas connection string.
- Set `DISCORD_REDIRECT_URI` to `https://YOUR-RENDER-DOMAIN/auth/discord/callback`.
- Set `DASHBOARD_URL` and `TRANSCRIPT_URL` to the same public URL.
- Set `COOKIE_SECURE=true`.

## Pterodactyl / VPS
Use Node.js 22, run `npm install`, configure `.env`, then `npm start`. The app listens on `PORT` (Render will provide its own PORT).

## Custom Discord emojis
The repository includes original custom emoji artwork in `public/assets/emojis`. Run:
```bash
npm run create-emojis
```
The script uploads them to the guilds where the bot is installed if it has the `Create Expressions` permission. It saves the emoji IDs/names in MongoDB and the bot automatically falls back to text symbols when a custom emoji is unavailable.

## Production notes
- Use HTTPS.
- Use a strong random `SESSION_SECRET`.
- Use MongoDB Atlas or a secured MongoDB deployment.
- Keep secrets only in environment variables.
- Configure a persistent database; important ticket state is never stored only in memory.
