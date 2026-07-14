const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Load the fixed forecast data once at startup.
// Base data is stored in US units (Fahrenheit, mph, miles, inHg) —
// matching Dark Sky's default "units=us".
const baseForecast = require('./darksky-forecast.json');

// ---- Unit conversion -------------------------------------------------------

// Field names that hold temperature values (°F in the base data)
const TEMPERATURE_FIELDS = new Set([
  'temperature', 'temperatureHigh', 'temperatureLow',
  'temperatureMin', 'temperatureMax',
  'apparentTemperature', 'apparentTemperatureHigh', 'apparentTemperatureLow',
  'apparentTemperatureMin', 'apparentTemperatureMax',
  'dewPoint'
]);

// Field names that hold speed values (mph in the base data)
const SPEED_FIELDS = new Set(['windSpeed', 'windGust']);

// Field names that hold distance values (miles in the base data)
const DISTANCE_FIELDS = new Set(['visibility', 'nearestStormDistance']);

// Field names that hold pressure values (millibars in the base data — same
// numeric value for both us/si in Dark Sky, so no conversion needed there)

function fahrenheitToCelsius(f) {
  return Math.round(((f - 32) * (5 / 9)) * 100) / 100;
}

function mphToMetersPerSecond(mph) {
  return Math.round(mph * 0.44704 * 100) / 100;
}

function milesToKm(mi) {
  return Math.round(mi * 1.60934 * 100) / 100;
}

// units: 'us' (default, Fahrenheit/mph/miles) or 'si' (Celsius/m-s/km)
function convertUnits(obj, units) {
  if (units === 'us') return obj; // base data is already in US units

  if (Array.isArray(obj)) {
    return obj.map(item => convertUnits(item, units));
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'number' && units === 'si') {
        if (TEMPERATURE_FIELDS.has(key)) {
          result[key] = fahrenheitToCelsius(value);
          continue;
        }
        if (SPEED_FIELDS.has(key)) {
          result[key] = mphToMetersPerSecond(value);
          continue;
        }
        if (DISTANCE_FIELDS.has(key)) {
          result[key] = milesToKm(value);
          continue;
        }
      }
      result[key] = convertUnits(value, units);
    }
    return result;
  }
  return obj;
}

function buildResponse(units) {
  const normalizedUnits = units === 'si' ? 'si' : 'us'; // default to us
  const converted = convertUnits(baseForecast, normalizedUnits);
  return {
    ...converted,
    flags: {
      ...converted.flags,
      units: normalizedUnits
    }
  };
}

// ---- Routes ---------------------------------------------------------------

// Mimics Dark Sky's URL shape: /forecast/:apikey/:lat,:lon?units=si
app.get('/forecast/:apikey/:latlon', (req, res) => {
  res.json(buildResponse(req.query.units));
});

// Simple no-params version too: /forecast?units=si
app.get('/forecast', (req, res) => {
  res.json(buildResponse(req.query.units));
});

app.get('/', (req, res) => {
  res.json({
    message: 'Mock Weather API (Dark Sky format) is running. Fixed demo data, supports ?units=us|si.',
    endpoints: [
      '/forecast/:apikey/:lat,:lon              e.g. /forecast/demo/37.8267,-122.4233',
      '/forecast/:apikey/:lat,:lon?units=si     Celsius / metric',
      '/forecast?units=us                       Fahrenheit / imperial (default)'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Mock Weather API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/forecast/demo/37.8267,-122.4233?units=si`);
});