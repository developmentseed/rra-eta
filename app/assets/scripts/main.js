/* global mapboxgl */
'use strict';
import config from './config';

import data from '../data/data.js';

console.log.apply(console, config.consoleMessage);
console.log('Environment', config.environment);

mapboxgl.accessToken = config.mapboxToken;

const scaleStyles = {
  'fixed': {
    "base": 1,
    "type": "interval",
    "property": "eta",
    "stops": [
      [0, '#1a9850'],
      [600, '#91cf60'],
      [1200, '#d9ef8b'],
      [1800, '#fee08b'],
      [3600, '#fc8d59'],
      [5400, '#d73027'],
      [7200, '#4d4d4d']
    ]
  },
  'normalized': {
    "base": 1,
    "type": "exponential",
    "property": "etaNorm",
    "stops": [
      [0, '#1a9850'],
      [0.17, '#91cf60'],
      [0.34, '#d9ef8b'],
      [0.5, '#fee08b'],
      [0.67, '#fc8d59'],
      [0.84, '#d73027'],
      [1, '#4d4d4d']
    ]
  }
}

if (!mapboxgl.supported()) {
  document.getElementById('map').innerHTML = 'Your browser does not support Mapbox GL';
} else {
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',

  });
  map.on('load', function () {
    map.addSource('eta-data', {
      type: 'geojson',
      data: data
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.addLayer({
      'id': 'eta',
      'type': 'circle',
      'source': 'eta-data',
      'layout': {
        'visibility': 'visible'
      },
      'paint': {
        "circle-color": scaleStyles['fixed'],
        "circle-blur": 0.5,
        "circle-radius": {
          "base": 1,
          "type": "exponential",
          "property": "popNorm",
          "stops": [
            [{ zoom: 0, value: 0}, 1],
            [{ zoom: 0, value: 1}, 2],
            [{ zoom: 6, value: 0}, 5],
            [{ zoom: 6, value: 1}, 15],
            [{ zoom: 14, value: 0}, 15],
            [{ zoom: 14, value: 1}, 45]
          ]
        },
        "circle-opacity": {
          "stops": [
            [0, 0.9],
            [6, 0.75],
            [12, 0.5]
          ]
        }
      }
    }, 'poi-scalerank2');


    // When a click event occurs near a feature, open a popup.
    map.on('click', function (e) {
      var features = map.queryRenderedFeatures(e.point);
      if (!features.length) {
        return;
      }
      var feature = features[0];

      new mapboxgl.Popup()
        .setLngLat(map.unproject(e.point))
        .setHTML(`<dl>
          <dt>Name</dt><dd>${feature.properties.name}</dd>
          <dt>Population</dt><dd>${feature.properties.pop}</dd>
          <dt>ETA</dt><dd>${Math.floor(feature.properties.eta / 60)} minutes</dd>
        </dl>`)
      .addTo(map);
    });
    // Use the same approach as above to indicate that the symbols are clickable
    // by changing the cursor style to 'pointer'.
    map.on('mousemove', function (e) {
      var features = map.queryRenderedFeatures(e.point);
      map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });

    // Change the style of the map
    var currentScale = 'fixed';
    document.getElementById('scale').addEventListener('click', function (e) {
      if (e.target.value) {
        var clickedOption = e.target.value;
        if (clickedOption !== currentScale) {
          // Change the style of the points
          map.setPaintProperty('eta', 'circle-color', scaleStyles[clickedOption]);

          // Update legend with new scale
          document.getElementById(currentScale).classList.add('hidden');
          document.getElementById(clickedOption).classList.remove('hidden');
          currentScale = clickedOption
        }
      }
    });

    // Zoom and pan the map
    document.getElementById('pan').addEventListener('click', function (e) {
      if (e.target && e.target.className === 'pan-target') {
        var clickedOption = e.target.innerText.toLowerCase();
        e.preventDefault();
        let bbox = [
          [-140,-80],
          [140,80]
        ]
        switch (clickedOption) {
          case 'morocco':
            bbox = [
              [-7.6971193,29.808015],
              [-1.0030033,35.4194301]
            ]
            break;
          case 'argentina':
            bbox = [
              [-68.1863623366,-30.2622241346],
              [-61.8066014761,-21.8945164799]
            ]
            break;
        }
        map.fitBounds(bbox, { padding: 20 });
      }
    });

  })
}
