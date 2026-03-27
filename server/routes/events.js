const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

function formatEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    foodTags: row.food_tags,
    source: row.source,
    sourceUrl: row.source_url,
    imageUrl: row.image_url,
    eventTime: row.event_time,
    postedAt: row.posted_at,
    isActive: row.is_active,
    location: {
      building: row.building_name,
      lat: row.building_lat,
      lng: row.building_lng
    }
  };
}

// GET /campus/:slug/events
router.get('/:slug/events', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { food, source, time } = req.query;

    // Check university exists
    const { data: unis } = await supabase
      .from('universities')
      .select('id')
      .eq('slug', slug);

    if (!unis || unis.length === 0) {
      return res.status(404).json({ error: `University "${slug}" not found` });
    }

    const uniId = unis[0].id;

    // Fetch events with building info
    let query = supabase
      .from('events')
      .select(`
        *,
        buildings (
          name,
          lat,
          lng
        )
      `)
      .eq('university_id', uniId)
      .eq('is_active', true)
      .order('event_time', { ascending: true });

    if (food) query = query.contains('food_tags', [food]);
    if (source) query = query.eq('source', source);

    const { data, error } = await query;
    if (error) throw error;

    const formatted = data.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      foodTags: row.food_tags,
      source: row.source,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      eventTime: row.event_time,
      postedAt: row.posted_at,
      isActive: row.is_active,
      location: {
        building: row.buildings?.name,
        lat: row.buildings?.lat,
        lng: row.buildings?.lng
      }
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET /campus/detail/:id
router.get('/detail/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('events')
      .select(`*, buildings (name, lat, lng)`)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: data.id,
      title: data.title,
      description: data.description,
      foodTags: data.food_tags,
      source: data.source,
      sourceUrl: data.source_url,
      imageUrl: data.image_url,
      eventTime: data.event_time,
      postedAt: data.posted_at,
      isActive: data.is_active,
      location: {
        building: data.buildings?.name,
        lat: data.buildings?.lat,
        lng: data.buildings?.lng
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;