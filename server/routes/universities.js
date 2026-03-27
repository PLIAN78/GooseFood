const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

module.exports = router;