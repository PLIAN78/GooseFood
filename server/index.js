require('dotenv').config();
const express = require('express');
const cors = require('cors');

const universitiesRouter = require('./routes/universities');
const eventsRouter = require('./routes/events');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/universities', universitiesRouter);
app.use('/campus', eventsRouter);

app.get('/', (req, res) => {
  res.json({ message: '🍕 FreeFood Finder API is running!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});