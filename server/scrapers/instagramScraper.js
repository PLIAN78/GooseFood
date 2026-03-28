require('dotenv').config();
const { chromium } = require('playwright');
const supabase = require('../config/db');

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

async function loginToInstagram(page) {
  console.log('🔐 Logging into Instagram...');

  await page.goto('https://www.instagram.com/accounts/login/', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(8000);

  // Handle cookie popup
  try {
    await page.click('button:has-text("Allow")', { timeout: 8000 });
    await page.waitForTimeout(1000);
  } catch {}
  try {
    await page.click('button:has-text("Accept")', { timeout: 8000 });
    await page.waitForTimeout(1000);
  } catch {}

  // Fill credentials
  await page.waitForSelector('input[name="email"]', { timeout: 60000 });
  await page.click('input[name="email"]');
  await page.waitForTimeout(500);
  await page.type('input[name="email"]', process.env.INSTAGRAM_USERNAME, { delay: 100 });

  await page.click('input[name="pass"]');
  await page.waitForTimeout(500);
  await page.type('input[name="pass"]', process.env.INSTAGRAM_PASSWORD, { delay: 100 });

  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');

  await page.waitForTimeout(8000);

  await page.screenshot({ path: 'after-login.png' });
  console.log('📸 Screenshot saved as after-login.png');

  // Dismiss popups
  try {
    await page.click('button:has-text("Not now")', { timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch {}
  try {
    await page.click('button:has-text("Not Now")', { timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch {}

  console.log('✅ Logged in!');
}

async function scrapeInstagramAccount(page, handle, universitySlug) {
  console.log(`📸 Scraping @${handle}...`);

  try {
    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForSelector('article', { timeout: 15000 });

    // Get post links
    const postLinks = await page.$$eval('article a', links =>
      links.slice(0, 12).map(a => a.href).filter(h => h.includes('/p/'))
    );

    console.log(`   Found ${postLinks.length} posts`);

    const foodPosts = [];

    for (const link of postLinks.slice(0, 8)) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(8000);

        // Try multiple selectors to get caption
        const caption = await page.evaluate(() => {
          const selectors = [
            'article h1',
            'article span[class*="caption"]',
            'div[data-testid="post-comment-root-0"] span',
            'article div > span > span',
            'article span'
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText && el.innerText.length > 10) {
              return el.innerText;
            }
          }
          return '';
        }).catch(() => '');

        if (!caption || !containsFoodKeyword(caption)) {
          await page.waitForTimeout(1000);
          continue;
        }

        console.log(`   ✅ Food post: ${caption.slice(0, 60)}...`);

        const imageUrl = await page.$eval(
          'article img',
          img => img.src
        ).catch(() => null);

        foodPosts.push({
          caption,
          imageUrl,
          sourceUrl: link,
          universitySlug
        });

        await page.waitForTimeout(2000);

      } catch (err) {
        console.log(`   ⚠️ Skipped post: ${err.message.slice(0, 50)}`);
      }
    }

    return foodPosts;

  } catch (err) {
    console.error(`   ❌ Failed to scrape @${handle}: ${err.message.slice(0, 80)}`);
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
      console.log(`   💾 Saved!`);

    } catch (err) {
      console.error(`   ❌ Failed to save: ${err.message}`);
    }
  }
}

async function runInstagramScraper() {
  console.log('\n🚀 Starting Instagram scraper...');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    await loginToInstagram(page);

    const allPosts = [];
    for (const account of INSTAGRAM_ACCOUNTS) {
      const posts = await scrapeInstagramAccount(page, account.handle, account.university_slug);
      allPosts.push(...posts);
      await page.waitForTimeout(8000);
    }

    console.log(`\n📦 Total food posts found: ${allPosts.length}`);
    await saveToDatabase(allPosts);

  } catch (err) {
    console.error('❌ Scraper error:', err.message);
  } finally {
    await browser.close();
    console.log('✅ Instagram scraper finished!\n');
  }
}

module.exports = { runInstagramScraper };