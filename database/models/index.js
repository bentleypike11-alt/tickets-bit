const mongoose = require('mongoose');
const { Schema } = mongoose;

const guildSchema = new Schema({ guildId: { type: String, unique: true, index: true }, name: String, icon: String, active: { type: Boolean, default: true } }, { timestamps: true });
const userSchema = new Schema({ userId: { type: String, unique: true, index: true }, username: String, avatar: String }, { timestamps: true });
const ticketTypeSchema = new Schema({
  guildId: { type: String, index: true }, name: String, description: String, buttonLabel: { type: String, default: 'Open Ticket' }, buttonStyle: { type: String, default: 'Primary' }, categoryId: String, supportRoleIds: [String], namingFormat: { type: String, default: 'ticket-{number}' }, welcomeMessage: { type: String, default: 'Thank you for contacting support. A member of our team will assist you shortly.' }, autoClose: { enabled: Boolean, inactiveHours: Number, warningHours: Number, warningMessage: String, closeMessage: String }, transcriptEnabled: { type: Boolean, default: true }, logEnabled: { type: Boolean, default: true }, permissionOverrides: Schema.Types.Mixed, enabled: { type: Boolean, default: true }
}, { timestamps: true });
const panelSchema = new Schema({ guildId: { type: String, index: true }, name: String, channelId: String, messageId: String, title: String, description: String, image: String, thumbnail: String, banner: String, color: String, ticketTypeIds: [String], buttons: [{ ticketTypeId: String, label: String, style: String, customId: String }], published: { type: Boolean, default: false } }, { timestamps: true });
const ticketSchema = new Schema({
  guildId: { type: String, index: true }, ticketId: { type: String, index: true }, number: Number, channelId: { type: String, index: true }, typeId: String, typeName: String, creatorId: String, creatorTag: String, claimerId: String, status: { type: String, enum: ['open','closed'], default: 'open', index: true }, locked: { type: Boolean, default: false }, priority: { type: String, default: 'normal' }, name: String, createdAt: { type: Date, default: Date.now }, closedAt: Date, closeReason: String, transferredTo: String, participantIds: [String], lastMessageAt: Date
}, { timestamps: true });
const transcriptSchema = new Schema({ guildId: { type: String, index: true }, ticketId: { type: String, index: true }, publicId: { type: String, unique: true, index: true }, ticketName: String, creatorId: String, creatorTag: String, claimerId: String, createdAt: Date, closedAt: Date, closeReason: String, visibility: { type: String, enum: ['public','restricted','staff'], default: 'public' }, html: String, messageCount: Number }, { timestamps: true });
const staffMemberSchema = new Schema({ guildId: { type: String, index: true }, userId: String, roleIds: [String], ticketsClaimed: { type: Number, default: 0 }, ticketsClosed: { type: Number, default: 0 }, ticketsHandled: { type: Number, default: 0 } }, { timestamps: true });
const guildSettingsSchema = new Schema({ guildId: { type: String, unique: true, index: true }, transcriptChannelId: String, ticketLogChannelId: String, staffLogChannelId: String, defaultCategoryId: String, dashboardEnabled: { type: Boolean, default: true }, transcriptVisibility: { type: String, enum: ['public','restricted','staff'], default: 'public' }, ticketCooldownSeconds: { type: Number, default: 0 }, maxOpenTicketsPerUser: { type: Number, default: 0 }, autoCloseEnabled: { type: Boolean, default: false }, claimRequired: { type: Boolean, default: false }, dmTranscript: { type: Boolean, default: false }, permissions: { supportRoleIds: [String], managementRoleIds: [String], administratorRoleIds: [String], ticketAccessRoleIds: [String] }, branding: { logo: String, banner: String, primaryColor: { type: String, default: '#8B5CF6' }, secondaryColor: { type: String, default: '#A855F7' }, footerText: { type: String, default: 'Ticket Bot' }, welcomeMessage: String } }, { timestamps: true });
const botProfileSchema = new Schema({ guildId: { type: String, unique: true, index: true }, botName: { type: String, default: 'Ticket Bot' }, avatar: String, description: String, status: { type: String, default: 'online' }, activityType: { type: String, default: 'Watching' }, activityText: { type: String, default: 'Managing Tickets' }, primaryColor: { type: String, default: '#8B5CF6' }, secondaryColor: { type: String, default: '#A855F7' }, banner: String, footerText: String, ticketLogo: String, transcriptBranding: String }, { timestamps: true });
const auditLogSchema = new Schema({ guildId: { type: String, index: true }, action: String, actorId: String, actorTag: String, ticketId: String, targetId: String, metadata: Schema.Types.Mixed }, { timestamps: true });
const ticketCounterSchema = new Schema({ guildId: { type: String, unique: true, index: true }, value: { type: Number, default: 0 } }, { timestamps: true });
const customEmojiSchema = new Schema({ guildId: { type: String, index: true }, name: String, emojiId: String, animated: { type: Boolean, default: false } }, { timestamps: true });

module.exports = {
  Guild: mongoose.models.Guild || mongoose.model('Guild', guildSchema),
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Ticket: mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema),
  TicketType: mongoose.models.TicketType || mongoose.model('TicketType', ticketTypeSchema),
  TicketPanel: mongoose.models.TicketPanel || mongoose.model('TicketPanel', panelSchema),
  Transcript: mongoose.models.Transcript || mongoose.model('Transcript', transcriptSchema),
  StaffMember: mongoose.models.StaffMember || mongoose.model('StaffMember', staffMemberSchema),
  GuildSettings: mongoose.models.GuildSettings || mongoose.model('GuildSettings', guildSettingsSchema),
  BotProfile: mongoose.models.BotProfile || mongoose.model('BotProfile', botProfileSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema),
  TicketCounter: mongoose.models.TicketCounter || mongoose.model('TicketCounter', ticketCounterSchema),
  CustomEmoji: mongoose.models.CustomEmoji || mongoose.model('CustomEmoji', customEmojiSchema)
};
