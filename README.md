# Field Map

A map app for field work that runs entirely offline. It's a PWA built on OpenLayers, and the whole thing lives in a single HTML file. No server, no build step, no accounts. Load it once on your phone, cache the tiles you need, and it keeps working when you're out of signal range.

I built this because I needed to plot drillhole and sample CSVs on a map in areas with no reception, and everything else was either online-only or wanted a subscription.

## What it does

- GPS tracking with a live position marker and accuracy readout, plus a "zoom to me" button
- Import CSVs with easting/northing or lat/lon columns. Files get sorted into layers automatically based on keywords in the filename (anything with HOLE in the name goes to the Hole layer, etc.)
- Draw points and lines on the map, pick colours, and export your markup back out as CSV
- Pre-cache map tiles for an area so the basemap works offline
- Toggle layers on and off individually or by group, zoom to a layer's extent, remove them when you're done
- Works in any projected CRS. Set the EPSG code and proj4 string in settings and your coordinates get reprojected to WGS84 for display

Base layers are OpenStreetMap, OpenTopoMap, ArcGIS satellite, and a plain grey canvas.

## Running it

It's static files, so pretty much anything works:

```bash
python -m http.server 8080
# or
npx serve .
```

Then go to http://localhost:8080. You can also just open index.html directly, but some browsers won't register the service worker over file://, so offline mode needs a proper HTTP server (or any static host like GitHub Pages / Netlify, where it all works automatically over HTTPS).

To install it on a phone: open the URL in Chrome/Edge on Android or Safari on iOS (16.4+) and use "Add to Home Screen". After that it launches like a normal app.

## CSV format

Any CSV with coordinate columns will import. Column names are configurable in settings, defaults are `Longitude` and `Latitude`. There's an optional hole ID column for labels.

```csv
HoleID,Easting,Northing,Type
DH001,394500,6823100,HOLE
DH002,394620,6823240,HOLE
```

If your coordinates are in a projected grid (UTM etc.), set the projection in settings first so they get converted properly.

## Layer types

Layers are matched by filename keyword, case-insensitive. Out of the box:

- `HOLE` - blue circles
- `SAMPLE` - green diamonds
- `GEOPHY` - orange squares

You can add your own types in settings and change the colour, size, shape, opacity, z-order and labels for each.

## Caching tiles for offline use

Pan to the area you need, open the Offline panel, pick a zoom range (10-17 is the default) and hit cache. Tiles download 8 at a time and go into their own cache that survives browser restarts. A 10 km² area over that zoom range takes maybe half a minute on a decent connection.

Heads up: check the terms of use for whichever tile provider you're bulk-caching from.

## Files

```
index.html      the entire app
sw.js           service worker (offline caching, tile prefetch)
manifest.json   PWA manifest
offline.html    fallback page
icon-*.png      app icons
```

Dependencies (OpenLayers 8.2, proj4js 2.11, PapaParse 5.4) load from jsDelivr with SRI hashes pinned, so there's nothing to install. If you bump a version, regenerate the integrity hash or the browser will refuse to load it.

## Browser support

Anything modern with service workers. Tested on Chrome/Edge (desktop and Android), Safari on iOS, and Firefox on desktop (works fine, just no PWA install).

## Contributing

PRs welcome. Fair warning: all the CSS, HTML and JS is inline in index.html on purpose, to keep it portable. It's a big file. Ctrl+F is your friend.

## License

MIT