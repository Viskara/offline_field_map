# Field Map

A progressive web app (PWA) for offline field data logging and visualisation. Built on [OpenLayers](https://openlayers.org/), it runs entirely in the browser with no server required — load it once and use it in the field with no internet connection.

---

## Features

### Map & Navigation
- Multiple base layers: OpenStreetMap, OpenTopoMap, ArcGIS Satellite, Grey Canvas
- GPS tracking with live position indicator and accuracy display
- "Zoom to me" button for instant re-centring
- Coordinate readout in any projected CRS (configurable)

### Data Import & Layers
- Import CSV files containing spatial data (easting/northing or lat/lon columns)
- Automatic layer detection by filename keyword (e.g. files containing `HOLE` → Hole layer)
- Per-layer visibility toggle, zoom-to-extent, and removal
- Collapsible layer groups with group-level visibility checkbox
- Quick layer bar for one-tap show/hide of loaded datasets

### Markup & Annotation
- Draw points and lines directly on the map
- Colour palette for markup styling
- Export markup to CSV

### Offline / PWA
- Service worker caches the app shell on first load
- Tile pre-caching: download map tiles for a defined zoom range over the current view
- Concurrent tile fetching (8 at a time) for fast cache builds
- Cache size reporting and one-tap cache clearing
- Installs to home screen on iOS, Android, and desktop Chrome

### Settings
- Custom coordinate column names (easting/northing aliases)
- Hole ID column mapping
- Starting map position and zoom
- Custom projection via EPSG code + proj4 string
- GPS accuracy threshold
- Tile cache zoom range (min/max zoom)
- Per layer-type: colour, size, opacity, shape (circle / square / diamond / triangle / star / cross / x), z-order, label visibility
- Tap slop and erase hit-radius for touch tuning

---

## Getting Started

Field Map is a single-file static application — no build step or server required.

### Option 1 — Open directly in a browser

```
open index.html
```

> Note: Some browser security policies restrict `file://` access to the service worker. For full PWA/offline functionality, serve over HTTP.

### Option 2 — Serve locally

Any static file server works:

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080`.

### Option 3 — Deploy to static hosting

Drop the files onto any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.). The service worker will activate automatically over HTTPS.

---

## File Structure

```
├── index.html        # Entire application (HTML + CSS + JS)
├── sw.js             # Service worker (caching, offline, tile pre-fetch)
├── manifest.json     # PWA manifest
├── offline.html      # Fallback page shown when offline and no cache hit
├── icon-48.png
├── icon-96.png
├── icon-192.png
└── icon-512.png
```

---

## CSV Format

Import any CSV that contains spatial columns. Column names are configurable in Settings.

| Column | Default alias | Description |
|---|---|---|
| Easting / Longitude | `Longitude` | X coordinate |
| Northing / Latitude | `Latitude` | Y coordinate |
| Hole ID | _(blank)_ | Optional label identifier |
| Label | — | Displayed on map if "Show label" is enabled for the layer type |

Coordinates are reprojected to WGS84 for display using the configured projection. The default projection is `EPSG:4326` (plain lat/lon).

**Example:**

```csv
HoleID,Easting,Northing,Type
DH001,394500,6823100,HOLE
DH002,394620,6823240,HOLE
```

---

## Layer Types

Each layer type is matched to CSV files by a **filename keyword** (case-insensitive). Default types:

| Keyword | Shape | Colour |
|---|---|---|
| `HOLE` | Circle | Blue |
| `SAMPLE` | Diamond | Green |
| `GEOPHY` | Square | Orange |

Custom layer types can be added, edited, or removed in **Settings → Layer Types**.

---

## Offline Tile Caching

1. Navigate to the area of interest and set your zoom level.
2. Open the **Offline** panel.
3. Choose a cache zoom range (default: zoom 10–17).
4. Tap **Cache tiles for current view** — a progress bar shows download status.
5. The cached tiles are stored in a dedicated `field-map-tiles-v1` cache and survive browser restarts.

Tiles are fetched 8 at a time to balance speed and memory use. A typical 10–17 zoom cache over a 10 km² area downloads in under 30 seconds on a good connection.

---

## Dependencies

All loaded from CDN — no `npm install` required.

| Library | Version | Purpose |
|---|---|---|
| [OpenLayers](https://openlayers.org/) | 8.2.0 | Map rendering |
| [proj4js](https://proj4js.org/) | 2.11.0 | Coordinate reprojection |
| [PapaParse](https://www.papaparse.com/) | 5.4.1 | CSV parsing |

---

## Browser Support

Any modern browser with service worker support. Tested on:

- Chrome / Edge (desktop & Android)
- Safari (iOS 16.4+) — PWA install via "Add to Home Screen"
- Firefox (desktop) — PWA install not supported but app works fully

---

## Contributing

Pull requests welcome. The entire app lives in `index.html` — CSS, HTML, and JavaScript are all inline for maximum portability (no bundler, no dependencies to install).

---

## License

MIT
