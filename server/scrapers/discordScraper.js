require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const supabase = require('../config/db');

const FOOD_KEYWORDS = [
  'free food', 'free pizza', 'free lunch', 'free dinner', 'free breakfast',
  'free snacks', 'free drinks', 'free coffee', 'free bubble tea', 'free sushi',
  'refreshments', 'come hungry', 'food provided', 'free meal', 'free tacos',
  'free bagels', 'free wings', 'free burgers', 'free donuts', 'free cookies'
];

const CHANNEL_KEYWORDS = [
  'event', 'food', 'announcement', 'general', 'free', 'campus'
];

const SERVER_MAP = {
  '1482870423338090649': 'waterloo',
};

function containsFoodKeyword(text) {
  const lower = text.toLowerCase();
  return FOOD_KEYWORDS.some(keyword => lower.includes(keyword));
}

function extractFoodTags(text) {
  const lower = text.toLowerCase();
  const tags = [];
  if (lower.includes('pizza')) tags.push('pizza');
  if (lower.includes('sushi')) tags.push('sushi');
  if (lower.includes('bubble tea') || lower.includes('boba')) tags.push('bubble tea');
  if (lower.includes('vegan') || lower.includes('plant-based')) tags.push('vegan');
  if (lower.includes('bbq') || lower.includes('burger')) tags.push('bbq');
  if (lower.includes('bagel')) tags.push('bagels');
  if (lower.includes('coffee')) tags.push('coffee');
  if (lower.includes('snack')) tags.push('snacks');
  if (lower.includes('drink') || lower.includes('juice')) tags.push('drinks');
  if (lower.includes('donut')) tags.push('donuts');
  if (lower.includes('cookie')) tags.push('cookies');
  if (tags.length === 0) tags.push('free food');
  return tags;
}

function isRelevantChannel(channelName) {
  const lower = channelName.toLowerCase();
  return CHANNEL_KEYWORDS.some(keyword => lower.includes(keyword));
}

async function saveEvent(message, universitySlug) {
  try {
    const { data: unis } = await supabase
      .from('universities')
      .select('id')
      .eq('slug', universitySlug);

    if (!unis || unis.length === 0) return;

    const universityId = unis[0].id;
    const text = message.content;
    const foodTags = extractFoodTags(text);

    const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

    // Avoid duplicates
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('source_url', messageUrl);

    if (existing && existing.length > 0) {
      console.log(`   ⏭️ Already saved, skipping`);
      return;
    }

    const { error } = await supabase.from('events').insert({
      university_id: universityId,
      title: text.slice(0, 80),
      description: text,
      food_tags: foodTags,
      source: 'discord',
      source_url: messageUrl,
      event_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      is_active: true
    });

    if (error) throw error;
    console.log(`💾 Saved Discord event: ${text.slice(0, 50)}...`);

  } catch (err) {
    console.error('❌ Failed to save Discord event:', err.message);
  }
}

function startDiscordBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ]
  });

  client.once('clientReady', () => {
    console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
    console.log(`📡 Watching ${client.guilds.cache.size} servers`);
    client.guilds.cache.forEach(guild => {
      console.log(`   - ${guild.name} (${guild.id})`);
    });
  });

  client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    console.log(`📨 Message in #${message.channel.name} (server: ${message.guildId}): ${message.content.slice(0, 50)}`);

    // Check if server is mapped
    const universitySlug = SERVER_MAP[message.guildId];
    if (!universitySlug) {
      console.log(`   ⏭️ Server not mapped`);
      return;
    }

    // Check if channel is relevant
    if (!isRelevantChannel(message.channel.name)) {
      console.log(`   ⏭️ Channel not relevant: ${message.channel.name}`);
      return;
    }

    // Check if message contains food keywords
    if (!containsFoodKeyword(message.content)) {
      console.log(`   ⏭️ No food keywords found`);
      return;
    }

    console.log(`🍕 Food message detected in #${message.channel.name}: ${message.content.slice(0, 60)}...`);
    await saveEvent(message, universitySlug);
  });

  client.login(process.env.DISCORD_TOKEN);

  return client;
}

module.exports = { startDiscordBot };