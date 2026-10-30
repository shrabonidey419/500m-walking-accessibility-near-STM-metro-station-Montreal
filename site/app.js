// Lab 3: metro stations and grocery access (Parts 6 to 8).

// preferCanvas draws every circle on one canvas instead of one page element
// per marker, which keeps the map fast with many points.
const map = L.map('map', { preferCanvas: true }).setView([45.50067037889345, -73.57793888179032], 12);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const LIMIT = Infinity;   // PART 6: all of them

// PART 8: one colour per metro line.
const colours = { Green: '#16e164', Yellow: 'rgb(225, 235, 28)', Orange: 'rgb(255, 128, 0)', Blue: '#0072ce' };

// Graduated colour for grocery counts, light to dark.
function colourFor(value) {
  if (value >= 50) return '#6c6c63';
  if (value >= 30)  return '#b98f23';
  if (value >= 10)  return '#f0a313';
  if (value >= 1)   return '#f08f20';
  if (value == 0)   return '#f1530f';
  return '#d8cdbc';
}

// Layer control, shared by every overlay below.
const layerControl = L.control.layers(null, {}, { collapsed: false }).addTo(map);

// ---- Metro stations ----
fetch('../data/MetroStops.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading MetroStops.geojson'); }
    return response.json();
  })
  .then(function (data) {
    const shown = { type: 'FeatureCollection', features: data.features.slice(0, LIMIT) };

    const metro = L.geoJSON(shown, {
      // PART 7: a small circle instead of the default pin.
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          weight: 0,
          fillOpacity: 0.7,
          fillColor: colours[feature.properties.line] || '#5639ce'
        });
      },
      // PART 8: a popup built from the properties the notebook wrote.
      onEachFeature: function (feature, layer) {
        const p = feature.properties;
        layer.bindPopup('<b>' + p.station + '</b><br>Line: ' + p.line + '<br>Wheelchair access: ' + p.wheelchair_access);
      }
    }).addTo(map);

    layerControl.addOverlay(metro, 'Metro stations');

    document.getElementById('status').textContent =
      shown.features.length + ' of ' + data.features.length + ' metro stations shown';

    // Metro line legend.
    const lineLegend = L.control({ position: 'bottomright' });
    lineLegend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = '<strong>Metro line</strong><br>' + Object.keys(colours).map(function (k) {
        return '<span style="background:' + colours[k] + '"></span>' + k;
      }).join('<br>');
      return div;
    };
    lineLegend.addTo(map);
  })
  .catch(function (err) {
    document.getElementById('status').textContent =
      'Could not load MetroStops.geojson. Open the console (F12) for details.';
    console.error(err);
  });

// ---- Grocery access: stations sized and coloured by groceries within 500 m ----
fetch('../data/MetroGrocery500m.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading MetroGrocery500m.geojson'); }
    return response.json();
  })
  .then(function (data) {
    const groceryLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        const n = feature.properties.within_500m;
        return L.circleMarker(latlng, {
          //radius: 4 + n,              // bigger circle = more groceries
          color: '#3d3333',
          fillColor: colourFor(n),    // darker = more groceries
          fillOpacity: 0.8,
          weight: 2
        });
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup('Grocery stores within 500 m: ' + feature.properties.within_500m);
      }
    }).addTo(map);

    layerControl.addOverlay(groceryLayer, 'Groceries within 500 m');
  })
  .catch(function (err) {
    console.error(err);
  });

// Grocery count legend (declared once, added once).
const groceryLegend = L.control({ position: 'bottomright' });
groceryLegend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  const rows = [[50, '50 or more'], [30, '30 to 49'], [20, '20 to 29'], [1, '1 to 20'], [0, 'none']];
  div.innerHTML = '<strong>Grocery stores within 500 m (count)</strong><br>' +
    rows.map(function (r) {
      return '<span style="background:' + colourFor(r[0]) + '"></span>' + r[1];
    }).join('<br>');
  return div;
};
groceryLegend.addTo(map);