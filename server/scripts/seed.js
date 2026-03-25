require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await client.query(`TRUNCATE events, buildings, universities RESTART IDENTITY CASCADE`);

    // Insert universities
    const uniResult = await client.query(`
      INSERT INTO universities (name, slug, lat, lng) VALUES
        ('University of Waterloo', 'waterloo', 43.4723, -80.5449),
        ('University of Toronto', 'uoft', 43.6629, -79.3957)
      RETURNING id, slug
    `);

    const waterloo = uniResult.rows.find(u => u.slug === 'waterloo');
    const uoft = uniResult.rows.find(u => u.slug === 'uoft');

    // Insert buildings
    const buildingResult = await client.query(`
      INSERT INTO buildings (university_id, name, lat, lng) VALUES
        ($1, 'Student Life Centre', 43.4718, -80.5452),
        ($1, 'Davis Centre', 43.4722, -80.5436),
        ($1, 'Math & Computer Building', 43.4728, -80.5421),
        ($2, 'Bahen Centre', 43.6597, -79.3978),
        ($2, 'Sidney Smith Hall', 43.6629, -79.3991),
        ($2, 'Hart House', 43.6647, -79.3962)
      RETURNING id, name
    `, [waterloo.id, uoft.id]);

    const slc = buildingResult.rows.find(b => b.name === 'Student Life Centre');
    const dc = buildingResult.rows.find(b => b.name === 'Davis Centre');
    const mc = buildingResult.rows.find(b => b.name === 'Math & Computer Building');
    const bahen = buildingResult.rows.find(b => b.name === 'Bahen Centre');
    const sidney = buildingResult.rows.find(b => b.name === 'Sidney Smith Hall');
    const hart = buildingResult.rows.find(b => b.name === 'Hart House');

    // Insert events
    await client.query(`
      INSERT INTO events (university_id, building_id, title, description, food_tags, source, event_time, is_active) VALUES
        ($1, $3, 'Free Pizza at SLC', 'Come by for slices and drinks after the club fair!', ARRAY['pizza','drinks'], 'discord', NOW() + interval '2 hours', true),
        ($1, $4, 'Bubble Tea Giveaway', 'First 50 students get a free bubble tea!', ARRAY['bubble tea','drinks'], 'instagram', NOW() + interval '1 hour', true),
        ($1, $5, 'CS Club Sushi Night', 'Free sushi for all CS students. Bring your student ID.', ARRAY['sushi','japanese'], 'discord', NOW() + interval '3 hours', true),
        ($1, $3, 'Engineering Refreshments', 'Snacks and coffee provided after the info session.', ARRAY['snacks','coffee'], 'instagram', NOW() + interval '30 minutes', true),
        ($2, $6, 'Bahen Bagel Morning', 'Free bagels and cream cheese in the lobby.', ARRAY['bagels','breakfast'], 'discord', NOW() + interval '4 hours', true),
        ($2, $7, 'Vegan Lunch Popup', 'Free vegan bowls from the sustainability club.', ARRAY['vegan','lunch'], 'instagram', NOW() + interval '5 hours', true),
        ($2, $8, 'Hart House BBQ', 'Free burgers and dogs on the front lawn.', ARRAY['bbq','burgers'], 'discord', NOW() + interval '6 hours', true)
    `, [waterloo.id, uoft.id, slc.id, dc.id, mc.id, bahen.id, sidney.id, hart.id]);

    console.log('Seed complete!');
    console.log('   - 2 universities');
    console.log('   - 6 buildings');
    console.log('   - 7 events');

  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();