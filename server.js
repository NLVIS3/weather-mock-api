const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ---- Helpers -------------------------------------------------------------

const ICONS = [
  'clear-day', 'clear-night', 'rain', 'snow', 'sleet',
  'wind', 'fog', 'cloudy', 'partly-cloudy-day', 'partly-cloudy-night'
];

const SUMMARIES = {
  'clear-day': 'Clear',
  'clear-night': 'Clear',
  'rain': 'Rain',
  'snow': 'Snow',
  'sleet': 'Sleet',
  'wind': 'Windy',
  'fog': 'Foggy',
  'cloudy': 'Overcast',
  'partly-cloudy-day': 'Partly Cloudy',
  'partly-cloudy-night': 'Partly Cloudy'
};

function rand(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

// Builds one "data point" (used for currently / hourly / daily entries)
function buildDataPoint(time, { daily = false } = {}) {
  const icon = pick(ICONS);
  const temperature = rand(45, 85, 2);
  const point = {
    time,
    summary: SUMMARIES[icon],
    icon,
    precipIntensity: rand(0, 0.05, 4),
    precipProbability: rand(0, 1, 2),
    ...(daily
      ? {
          temperatureHigh: temperature,
          temperatureLow: rand(temperature - 20, temperature - 5, 2),
          apparentTemperatureHigh: temperature,
          apparentTemperatureLow: rand(temperature - 20, temperature - 5, 2),
          sunriseTime: time + 6 * 3600,
          sunsetTime: time + 18 * 3600,
          moonPhase: rand(0, 1, 2)
        }
      : {
          temperature,
          apparentTemperature: temperature
        }),
    dewPoint: rand(20, 60, 2),
    humidity: rand(0.1, 0.9, 2),
    pressure: rand(990, 1030, 2),
    windSpeed: rand(0, 20, 2),
    windGust: rand(0, 30, 2),
    windBearing: Math.floor(rand(0, 359, 0)),
    cloudCover: rand(0, 1, 2),
    uvIndex: Math.floor(rand(0, 10, 0)),
    visibility: rand(0, 10, 2),
    ozone: rand(200, 350, 2)
  };
  return point;
}

function buildMinutely(baseTime) {
  const icon = pick(ICONS);
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({
      time: baseTime + i * 60,
      precipIntensity: rand(0, 0.02, 4),
      precipProbability: rand(0, 1, 2)
    });
  }
  return {
    summary: `${SUMMARIES[icon]} for the hour.`,
    icon,
    data
  };
}

function buildHourly(baseTime) {
  const icon = pick(ICONS);
  const data = [];
  for (let i = 0; i < 48; i++) {
    data.push(buildDataPoint(baseTime + i * 3600));
  }
  return {
    summary: `${SUMMARIES[icon]} throughout the day.`,
    icon,
    data
  };
}

function buildDaily(baseTime) {
  const icon = pick(ICONS);
  const data = [];
  for (let i = 0; i < 7; i++) {
    data.push(buildDataPoint(baseTime + i * 86400, { daily: true }));
  }
  return {
    summary: `${SUMMARIES[icon]} for the week.`,
    icon,
    data
  };
}

function buildForecast(latitude, longitude) {
  const time = nowUnix();
  return {
    latitude,
    longitude,
    timezone: 'America/Los_Angeles',
    currently: buildDataPoint(time),
    minutely: buildMinutely(time),
    hourly: buildHourly(time),
    daily: buildDaily(time),
    flags: {
      sources: ['mock'],
      'nearest-station': 0,
      units: 'us'
    },
    offset: -8
  };
}

// ---- Routes ---------------------------------------------------------------

// Mimics Dark Sky's URL shape: /forecast/:apikey/:lat,:lon
app.get('/forecast/:apikey/:latlon', (req, res) => {
  const [lat, lon] = req.params.latlon.split(',').map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid lat,lon format. Use /forecast/demo/37.8267,-122.4233' });
  }
  res.json(buildForecast(lat, lon));
});

// Simple query-param version too: /forecast?lat=..&lon=..
app.get('/forecast', (req, res) => {
  const lat = Number(req.query.lat ?? 37.8267);
  const lon = Number(req.query.lon ?? -122.4233);
  res.json(buildForecast(lat, lon));
});

app.get('/', (req, res) => {
  res.json({
    message: 'Mock Weather API (Dark Sky format) is running.',
    endpoints: [
      '/forecast/:apikey/:lat,:lon   e.g. /forecast/demo/37.8267,-122.4233',
      '/forecast?lat=37.8267&lon=-122.4233'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Mock Weather API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/forecast/demo/37.8267,-122.4233`);
});
