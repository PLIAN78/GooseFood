const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/:slug/events', async (req, res) => {
  try {
    const { slug } = req.params;
    const { food } = req.query;

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

    const params = [slug];

    if (food) {
      query += ` AND $2 = ANY(e.food_tags)`;
      params.push(food);
    }

    query += ` ORDER BY e.event_time ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;