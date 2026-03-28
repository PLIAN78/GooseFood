require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await supabase.from('events').delete().neq('id', 0);
  await supabase.from('buildings').delete().neq('id', 0);
  await supabase.from('universities').delete().neq('id', 0);

  // Insert universities
  const { data: universities, error: uniError } = await supabase
    .from('universities')
    .insert([
      { name: 'University of Waterloo', slug: 'waterloo', lat: 43.4723, lng: -80.5449 },
      { name: 'University of Toronto', slug: 'uoft', lat: 43.6629, lng: -79.3957 },
      { name: 'Western University', slug: 'western', lat: 43.0096, lng: -81.2737 },
      { name: 'McMaster University', slug: 'mcmaster', lat: 43.2609, lng: -79.9192 },
      { name: 'Queens University', slug: 'queens', lat: 44.2253, lng: -76.4951 },
      { name: 'University of Ottawa', slug: 'uottawa', lat: 45.4231, lng: -75.6831 },
      { name: 'Carleton University', slug: 'carleton', lat: 45.3875, lng: -75.6960 },
      { name: 'York University', slug: 'yorku', lat: 43.7735, lng: -79.5019 },
    ])
    .select();

  if (uniError) {
    console.error('❌ Failed to insert universities:', uniError.message);
    return;
  }

  console.log(`✅ Inserted ${universities.length} universities`);

  const getUni = (slug) => universities.find(u => u.slug === slug);

  // Insert buildings
  const { data: buildings, error: buildingError } = await supabase
    .from('buildings')
    .insert([
      // Waterloo
      { university_id: getUni('waterloo').id, name: 'Student Life Centre', lat: 43.4718, lng: -80.5452 },
      { university_id: getUni('waterloo').id, name: 'Davis Centre', lat: 43.4722, lng: -80.5436 },
      { university_id: getUni('waterloo').id, name: 'Math & Computer Building', lat: 43.4728, lng: -80.5421 },

      // UofT
      { university_id: getUni('uoft').id, name: 'Bahen Centre', lat: 43.6597, lng: -79.3978 },
      { university_id: getUni('uoft').id, name: 'Sidney Smith Hall', lat: 43.6629, lng: -79.3991 },
      { university_id: getUni('uoft').id, name: 'Hart House', lat: 43.6647, lng: -79.3962 },

      // Western
      { university_id: getUni('western').id, name: 'University Community Centre', lat: 43.0096, lng: -81.2737 },
      { university_id: getUni('western').id, name: 'Middlesex College', lat: 43.0081, lng: -81.2752 },

      // McMaster
      { university_id: getUni('mcmaster').id, name: 'McMaster University Student Centre', lat: 43.2609, lng: -79.9192 },
      { university_id: getUni('mcmaster').id, name: 'Burke Science Building', lat: 43.2619, lng: -79.9201 },

      // Queens
      { university_id: getUni('queens').id, name: 'John Deutsch University Centre', lat: 44.2253, lng: -76.4951 },
      { university_id: getUni('queens').id, name: 'Stirling Hall', lat: 44.2243, lng: -76.4941 },

      // uOttawa
      { university_id: getUni('uottawa').id, name: 'University Centre', lat: 45.4231, lng: -75.6831 },
      { university_id: getUni('uottawa').id, name: 'Tabaret Hall', lat: 45.4241, lng: -75.6821 },

      // Carleton
      { university_id: getUni('carleton').id, name: 'Unicentre', lat: 45.3875, lng: -75.6960 },
      { university_id: getUni('carleton').id, name: 'Richcraft Hall', lat: 45.3865, lng: -75.6950 },

      // York
      { university_id: getUni('yorku').id, name: 'Student Centre', lat: 43.7735, lng: -79.5019 },
      { university_id: getUni('yorku').id, name: 'Vari Hall', lat: 43.7745, lng: -79.5009 },
    ])
    .select();

  if (buildingError) {
    console.error('❌ Failed to insert buildings:', buildingError.message);
    return;
  }

  console.log(`✅ Inserted ${buildings.length} buildings`);

  const getBuilding = (name) => buildings.find(b => b.name === name);

  // Insert events
  const { error: eventError } = await supabase
    .from('events')
    .insert([
      // Waterloo
      { university_id: getUni('waterloo').id, building_id: getBuilding('Student Life Centre').id, title: 'Free Pizza at SLC', description: 'Come by for slices and drinks after the club fair!', food_tags: ['pizza', 'drinks'], source: 'discord', event_time: new Date(Date.now() + 2 * 3600000).toISOString(), is_active: true },
      { university_id: getUni('waterloo').id, building_id: getBuilding('Davis Centre').id, title: 'Bubble Tea Giveaway', description: 'First 50 students get a free bubble tea!', food_tags: ['bubble tea', 'drinks'], source: 'instagram', event_time: new Date(Date.now() + 1 * 3600000).toISOString(), is_active: true },
      { university_id: getUni('waterloo').id, building_id: getBuilding('Math & Computer Building').id, title: 'CS Club Sushi Night', description: 'Free sushi for all CS students. Bring your student ID.', food_tags: ['sushi'], source: 'discord', event_time: new Date(Date.now() + 3 * 3600000).toISOString(), is_active: true },

      // UofT
      { university_id: getUni('uoft').id, building_id: getBuilding('Bahen Centre').id, title: 'Bahen Bagel Morning', description: 'Free bagels and cream cheese in the lobby.', food_tags: ['bagels', 'breakfast'], source: 'discord', event_time: new Date(Date.now() + 4 * 3600000).toISOString(), is_active: true },
      { university_id: getUni('uoft').id, building_id: getBuilding('Hart House').id, title: 'Hart House BBQ', description: 'Free burgers and dogs on the front lawn.', food_tags: ['bbq', 'burgers'], source: 'discord', event_time: new Date(Date.now() + 5 * 3600000).toISOString(), is_active: true },
      { university_id: getUni('uoft').id, building_id: getBuilding('Sidney Smith Hall').id, title: 'Vegan Lunch Popup', description: 'Free vegan bowls from the sustainability club.', food_tags: ['vegan', 'lunch'], source: 'instagram', event_time: new Date(Date.now() + 6 * 3600000).toISOString(), is_active: true },

      // Western
      { university_id: getUni('western').id, building_id: getBuilding('University Community Centre').id, title: 'Free Tacos at UCC', description: 'Taco Tuesday! Free tacos while supplies last.', food_tags: ['tacos'], source: 'discord', event_time: new Date(Date.now() + 2 * 3600000).toISOString(), is_active: true },

      // McMaster
      { university_id: getUni('mcmaster').id, building_id: getBuilding('McMaster University Student Centre').id, title: 'Engineering Pizza Night', description: 'Free pizza for engineering students at MUSC.', food_tags: ['pizza'], source: 'discord', event_time: new Date(Date.now() + 3 * 3600000).toISOString(), is_active: true },

      // Queens
      { university_id: getUni('queens').id, building_id: getBuilding('John Deutsch University Centre').id, title: 'Free Coffee & Donuts', description: 'Stop by JDUC for free coffee and donuts during exam season!', food_tags: ['coffee', 'donuts'], source: 'instagram', event_time: new Date(Date.now() + 1 * 3600000).toISOString(), is_active: true },

      // uOttawa
      { university_id: getUni('uottawa').id, building_id: getBuilding('University Centre').id, title: 'Multicultural Food Fair', description: 'Free food samples from around the world!', food_tags: ['free food'], source: 'discord', event_time: new Date(Date.now() + 4 * 3600000).toISOString(), is_active: true },

      // Carleton
      { university_id: getUni('carleton').id, building_id: getBuilding('Unicentre').id, title: 'Free Ramen Night', description: 'Hot ramen for all students at the Unicentre.', food_tags: ['snacks'], source: 'instagram', event_time: new Date(Date.now() + 2 * 3600000).toISOString(), is_active: true },

      // York
      { university_id: getUni('yorku').id, building_id: getBuilding('Student Centre').id, title: 'Bubble Tea Social', description: 'Free bubble tea at the York Student Centre!', food_tags: ['bubble tea', 'drinks'], source: 'discord', event_time: new Date(Date.now() + 3 * 3600000).toISOString(), is_active: true },
    ]);

  if (eventError) {
    console.error('❌ Failed to insert events:', eventError.message);
    return;
  }

  console.log('✅ Inserted 12 events');
  console.log('\n🎉 Seed complete!');
  console.log(`   - ${universities.length} universities`);
  console.log(`   - ${buildings.length} buildings`);
  console.log('   - 12 events');
}

seed();