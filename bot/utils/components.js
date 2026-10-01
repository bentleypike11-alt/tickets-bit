const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { CustomEmoji } = require('../../database/models');

const FALLBACK = { ticket: '▣', support: '◆', claim: '✓', close: '×', lock: '▣', unlock: '□', transcript: '≡', settings: '⚙', user: '●', success: '✓', error: '!' };
async function emoji(guildId, name) {
  const e = await CustomEmoji.findOne({ guildId, name }).lean().catch(() => null);
  return e ? `<${e.animated ? 'a' : ''}:${e.name}:${e.emojiId}>` : FALLBACK[name] || '';
}
function row(buttons) { return new ActionRowBuilder().addComponents(...buttons); }
function button(customId, label, style = 'Primary', disabled = false) {
  const styles = { Primary: ButtonStyle.Primary, Secondary: ButtonStyle.Secondary, Success: ButtonStyle.Success, Danger: ButtonStyle.Danger, Link: ButtonStyle.Link };
  const b = new ButtonBuilder().setLabel(label).setStyle(styles[style] || ButtonStyle.Primary).setDisabled(disabled);
  if (style === 'Link') b.setURL(customId); else b.setCustomId(customId);
  return b;
}
function panelContainer({ title, description, rows = [], color = 0x8B5CF6 }) {
  const c = new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
  if (description) c.addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
  if (rows.length) c.addSeparatorComponents(new SeparatorBuilder()).addActionRowComponents(...rows);
  return c;
}
function v2(content) { return { flags: MessageFlags.IsComponentsV2, components: [content] }; }
module.exports = { emoji, row, button, panelContainer, v2 };
