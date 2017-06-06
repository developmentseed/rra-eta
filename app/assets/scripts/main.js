/* global mapboxgl */
'use strict';
import config from './config';

import etaData from '../data/eta.js';
import poiData from '../data/poi.js';

console.log.apply(console, config.consoleMessage);
console.log('Environment', config.environment);

mapboxgl.accessToken = config.mapboxToken;

const scaleStyles = {
  'colorEtaBuckets': {
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
  'colorEtaNormalized': {
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

const radiusStyles = {
  'radiusPopNormalized': {
    "base": 1,
    "type": "interval",
    "property": "popNorm",
    "stops": [
      [{ zoom: 0, value: 0}, 2],
      [{ zoom: 0, value: 1}, 5],
      [{ zoom: 6, value: 0}, 5],
      [{ zoom: 6, value: 1}, 25],
      [{ zoom: 14, value: 0}, 15],
      [{ zoom: 14, value: 1}, 45]
    ]
  },
  'radiusPopBuckets': {
    "base": 1,
    "type": "interval",
    "property": "pop",
    "stops": [
      [{ zoom: 0, value: 0}, 1],
      [{ zoom: 0, value: 100}, 2],
      [{ zoom: 0, value: 1000}, 2],
      [{ zoom: 0, value: 5000}, 2],
      [{ zoom: 0, value: 10000}, 2],
      [{ zoom: 0, value: 20000}, 2],
      [{ zoom: 6, value: 0}, 2],
      [{ zoom: 6, value: 100}, 4],
      [{ zoom: 6, value: 1000}, 5],
      [{ zoom: 6, value: 5000}, 10],
      [{ zoom: 6, value: 10000}, 15],
      [{ zoom: 6, value: 20000}, 20],
      [{ zoom: 14, value: 0}, 5],
      [{ zoom: 14, value: 100}, 8],
      [{ zoom: 14, value: 1000}, 15],
      [{ zoom: 14, value: 5000}, 25],
      [{ zoom: 14, value: 10000}, 35],
      [{ zoom: 14, value: 20000}, 45]
    ]
  },
  'radiusFixed': {
    "base": 1,
    "type": "interval",
    "property": "pop",
    "stops": [
      [{ zoom: 0, value: 0}, 2],
      [{ zoom: 6, value: 0}, 5],
      [{ zoom: 14, value: 0}, 15]
    ]
  }
}

if (!mapboxgl.supported()) {
  document.getElementById('map').innerHTML = 'Your browser does not support Mapbox GL';
} else {
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9'
  });
  map.on('load', function () {
    map.addSource('etaSource', {
      type: 'geojson',
      data: etaData
    })
    map.addSource('poiSource', {
      type: 'geojson',
      data: poiData
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.addLayer({
      'id': 'eta',
      'type': 'circle',
      'source': 'etaSource',
      'paint': {
        "circle-color": scaleStyles['colorEtaBuckets'],
        "circle-radius": radiusStyles['radiusPopNormalized'],
        "circle-blur": 0.5,
        "circle-opacity": {
          "stops": [
            [0, 0.1],
            [6, 0.5],
            [12, 0.75],
            [16, 0.9]
          ]
        }
      }
    }, 'poi-scalerank2');


    map.addLayer({
      'id': 'poi',
      'source': 'poiSource',
      'layout': {
        'visibility': 'visible'
      },
      'type': 'circle',
      'paint': {
        'circle-color': '#009fda',
        'circle-stroke-width': {
          "stops": [
            [0, 0],
            [6,2]
          ]
        },
        'circle-stroke-color': '#fff',
        'circle-radius': {
          "stops": [
            [0, 0],
            [6, 5],
            [14, 15]
          ]
        }
      }
    }, 'poi-scalerank2');

    // When a click event occurs near a feature, open a popup.
    map.on('click', function (e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ['eta', 'poi'] });
      if (!features.length) {
        return;
      }
      var feature = features[0];

      let popupHTML = '';

      switch(feature.layer.id) {
        case 'eta':
          popupHTML = `<h1>Origin</h1>
            <dl>
              <dt>Name</dt><dd>${feature.properties.name || 'unknown'}</dd>
              <dt>Population</dt><dd>${feature.properties.pop || 'unknown'}</dd>
              <dt>ETA</dt><dd>${Math.floor(feature.properties.eta / 60)} minutes</dd>
            </dl>`
          break;
        case 'poi':
          popupHTML = `<h1>Destination</h1>
            <dl>
              <dt>Name</dt><dd>${feature.properties.name || 'unknown'}</dd>
            </dl>`
          break;
      }

      new mapboxgl.Popup()
        .setLngLat(map.unproject(e.point))
        .setHTML(popupHTML)
        .addTo(map);
    });
    // Use the same approach as above to indicate that the symbols are clickable
    // by changing the cursor style to 'pointer'.
    map.on('mousemove', function (e) {
      var features = map.queryRenderedFeatures(e.point);
      map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });

    // Show / hide destination markers
    document.getElementById('checkboxDestinations').addEventListener('click', function (e) {
      if (e.target.checked) {
        map.setLayoutProperty('poi', 'visibility', 'visible')
      } else {
        map.setLayoutProperty('poi', 'visibility', 'none')
      }
    });

    // Change the Color Scale of the map
    var currentColorScale = 'colorEtaBuckets';
    document.getElementById('colorScale').addEventListener('click', function (e) {
      if (e.target.value) {
        var clickedOption = e.target.value;
        if (clickedOption !== currentColorScale) {
          // Change the style of the points
          map.setPaintProperty('eta', 'circle-color', scaleStyles[clickedOption]);

          // Update legend with new scale
          document.getElementById(currentColorScale).classList.add('hidden');
          document.getElementById(clickedOption).classList.remove('hidden');
          currentColorScale = clickedOption
        }
      }
    });

    // Change the Circle Width of the map
    var currentCircleWidth = 'radiusPopNormalized';
    document.getElementById('circleWidth').addEventListener('click', function (e) {
      console.log(currentCircleWidth)
      console.log(e)
      if (e.target.value) {
        var clickedOption = e.target.value;
        if (clickedOption !== currentCircleWidth) {
          // Change the style of the points
          map.setPaintProperty('eta', 'circle-radius', radiusStyles[clickedOption]);

          // // Update legend with new scale
          // document.getElementById(currentCircleWidth).classList.add('hidden');
          // document.getElementById(clickedOption).classList.remove('hidden');
          currentCircleWidth = clickedOption
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
