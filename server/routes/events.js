const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to shape raw DB row into clean response
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
    const uniCheck = await db.query('SELECT id FROM universities WHERE slug = $1', [slug]);
    if (uniCheck.rows.length === 0) {
      return res.status(404).json({ error: `University "${slug}" not found` });
    }

    // Base query
    let query = `
      SELECT
        e.id, e.title, e.description, e.food_tags,
        e.source, e.source_url, e.image_url,
        e.event_time, e.posted_at, e.is_active,
        b.name AS building_name,
        b.lat AS building_lat,
        b.lng AS building_lng
      FROM events e
      JOIN universities u ON e.university_id = u.id
      LEFT JOIN buildings b ON e.building_id = b.id
      WHERE u.slug = $1 AND e.is_active = true
    `;

    const values = [slug];

    // Food filter
    if (food) {
      values.push(food);
      query += ` AND $${values.length} = ANY(e.food_tags)`;
    }

    // Source filter
    if (source) {
      values.push(source);
      query += ` AND e.source = $${values.length}`;
    }

    // Time filter
    if (time === 'now') {
      query += ` AND e.event_time >= NOW() - INTERVAL '1 hour'
                 AND e.event_time <= NOW() + INTERVAL '1 hour'`;
    } else if (time === 'today') {
      query += ` AND DATE(e.event_time) = CURRENT_DATE`;
    } else if (time === 'week') {
      query += ` AND e.event_time >= NOW()
                 AND e.event_time <= NOW() + INTERVAL '7 days'`;
    }

    query += ` ORDER BY e.event_time ASC`;

    const result = await db.query(query, values);
    res.json(result.rows.map(formatEvent));

  } catch (err) {
    next(err);
  }
});

// GET /events/:id
router.get('/detail/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        e.id, e.title, e.description, e.food_tags,
        e.source, e.source_url, e.image_url,
        e.event_time, e.posted_at, e.is_active,
        b.name AS building_name,
        b.lat AS building_lat,
        b.lng AS building_lng
      FROM events e
      LEFT JOIN buildings b ON e.building_id = b.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(formatEvent(result.rows[0]));

  } catch (err) {
    next(err);
  }
});

module.exports = router;