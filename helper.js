const axios = require('axios');

// See README for an explanation of why this line is needed
const MAP_KEY = 'put your Google Geocoding API key here';

const location = process.argv[2];
const encodedLocation = encodeURIComponent(location);
const locationURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${MAP_KEY}`;

axios.get(locationURL).then(response => {
  if (response.data.status === 'ZERO_RESULTS') {
    throw new Error('Unable to find that address');
  }

  const lat = response.data.results[0].geometry.location.lat;
  const lng = response.data.results[0].geometry.location.lng;

  console.log(`${lat},${lng}`);
}).catch(err => {
  throw new Error(err);
})
