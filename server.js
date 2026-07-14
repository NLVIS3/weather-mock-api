const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Load the fixed forecast data once at startup.
// This is the exact JSON captured from the Dark Sky screenshot ("currently"
// block matches exactly), with realistic minutely/hourly/daily/flags data.
const forecastData = require('./darksky-forecast.json');

// ---- Routes ---------------------------------------------------------------

// Mimics Dark Sky's URL shape: /forecast/:apikey/:lat,:lon
// Always returns the same fixed JSON, regardless of the values passed in.
app.get('/forecast/:apikey/:latlon', (req, res) => {
  res.json(forecastData);
});

// Simple no-params version too
app.get('/forecast', (req, res) => {
  res.json(forecastData);
});

app.get('/', (req, res) => {
  res.json({
    message: 'Mock Weather API (Dark Sky format) is running. Always returns fixed demo data.',
    endpoints: [
      '/forecast/:apikey/:lat,:lon   e.g. /forecast/demo/37.8267,-122.4233',
      '/forecast'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Mock Weather API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/forecast/demo/37.8267,-122.4233`);
});
