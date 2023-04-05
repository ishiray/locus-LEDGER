const https = require('https')
const fs = require('fs');

const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'))
app.use(express.json());

https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    }, 
    app)
  .listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });

const locations = new Map();

app.post('/update_location', (req, res) => {
  const { username, location } = req.body;
  if (locations.has(username)) {
    locations.get(username).push(location);
  }
  else {
    locations.set(username, []);
  }
  // V REMOVE THIS V
  res.status(200).end();
});

app.get('/current_location', (req, res) => {
  console.log(locations);
  res.json(JSON.stringify(Array.from(locations).map(([username, locations]) => ({ username, location: locations.at(-1) }))));
});

function distance(lat1, lon1, lat2, lon2) 
{
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) 
{
  return Value * Math.PI / 180;
}

app.post('/get_vehicle_statistics', (req, res) => {
  const { username } = req.body;
  const locs = locations.get(username) ?? [];
  if (!locs.length) {
    res.json(JSON.stringify({ distance_travelled: 0 }));
    return;
  }
  let sum = 0;
  for (let i = 0; i < locs.length - 1; i++) {
    sum += distance(locs[i].lat, locs[i].lng, locs[i+1].lat, locs[i+1].lng) * 1000;
  }
  // sum = distance(locs.at(-1).lat, locs.at(-1).lng, locs[0].lat, locs[0].lng);
  res.json(JSON.stringify({ distance_travelled: sum }));
});