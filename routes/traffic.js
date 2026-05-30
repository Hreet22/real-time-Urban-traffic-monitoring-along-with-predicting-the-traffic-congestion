const router = require('express').Router();
const fetch  = require('node-fetch');

router.get('/', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car` +
                `?api_key=${process.env.ORS_API_KEY}` +
                `&start=${lng},${lat}&end=${lng},${lat}`;

    const response = await fetch(url);
    const data     = await response.json();

    const speedKmh = data.features?.[0]?.properties?.summary?.duration
      ? Math.round(data.features[0].properties.summary.distance /
                  (data.features[0].properties.summary.duration / 3600))
      : 30;

    const volumeIndex = speedKmh < 20 ? 8
                      : speedKmh < 40 ? 5
                      : speedKmh < 60 ? 3 : 1;

    return res.json({ speedKmh, volumeIndex, source: 'openrouteservice' });

  } catch (err) {
    console.error('ORS error:', err.message);
    return res.json({ speedKmh: 30, volumeIndex: 5, source: 'fallback' });
  }
});

module.exports = router;