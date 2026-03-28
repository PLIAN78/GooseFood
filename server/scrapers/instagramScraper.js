require('dotenv').config();
const { ApifyClient } = require('apify-client');
const supabase = require('../config/db');

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const FOOD_KEYWORDS = [
  'free food', 'free pizza', 'free lunch', 'free dinner', 'free breakfast',
  'free snacks', 'free drinks', 'free coffee', 'free bubble tea', 'free sushi',
  'refreshments', 'come hungry', 'food provided', 'free meal', 'free tacos',
  'free bagels', 'free wings', 'free burgers'
];

const INSTAGRAM_ACCOUNTS = [
  { handle: 'uwaterloolife', university_slug: 'waterloo' },
  { handle: 'yourwusa', university_slug: 'waterloo' },
  { handle: 'uoftstudentlife', university_slug: 'uoft' },
  { handle: 'uoftsu', university_slug: 'uoft' },
];

function containsFoodKeyword(text) {
  if (!text) return false;
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
  if (tags.length === 0) tags.push('free food');
  return tags;
}

async function scrapeAccount(handle, universitySlug) {
  console.log(`📸 Scraping @${handle} via Apify...`);

  try {
    const run = await client.actor('apify/instagram-post-scraper').call({
      username: [handle],
      resultsLimit: 20,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`   Found ${items.length} posts`);

    const foodPosts = items.filter(item => containsFoodKeyword(item.caption));
    console.log(`   ${foodPosts.length} food-related posts`);

    return foodPosts.map(item => ({
      caption: item.caption || '',
      imageUrl: item.displayUrl || null,
      sourceUrl: item.url || `https://instagram.com/p/${item.shortCode}`,
      universitySlug
    }));

  } catch (err) {
    console.error(`   ❌ Failed to scrape @${handle}: ${err.message}`);
    return [];
  }
}

async function saveToDatabase(posts) {
  for (const post of posts) {
    try {
      const { data: unis } = await supabase
        .from('universities')
        .select('id')
        .eq('slug', post.universitySlug);

      if (!unis || unis.length === 0) continue;

      const universityId = unis[0].id;
      const foodTags = extractFoodTags(post.caption);

      // Avoid duplicates
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source_url', post.sourceUrl);

      if (existing && existing.length > 0) {
        console.log(`   ⏭️ Already saved, skipping`);
        continue;
      }

      const { error } = await supabase.from('events').insert({
        university_id: universityId,
        title: post.caption.slice(0, 80),
        description: post.caption,
        food_tags: foodTags,
        source: 'instagram',
        source_url: post.sourceUrl,
        image_url: post.imageUrl,
        event_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        is_active: true
      });

      if (error) throw error;
      console.log(`   💾 Saved: ${post.caption.slice(0, 50)}...`);

    } catch (err) {
      console.error(`   ❌ Failed to save: ${err.message}`);
    }
  }
}

async function runInstagramScraper() {
  console.log('\n🚀 Starting Instagram scraper via Apify...');

  const allPosts = [];
  for (const account of INSTAGRAM_ACCOUNTS) {
    const posts = await scrapeAccount(account.handle, account.university_slug);
    allPosts.push(...posts);
  }

  console.log(`\n📦 Total food posts found: ${allPosts.length}`);
  await saveToDatabase(allPosts);
  console.log('✅ Instagram scraper finished!\n');
}

module.exports = { runInstagramScraper };