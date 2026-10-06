import { Fragment, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { resolveCoordinates } from '../utils/geocode.js';
import { riskColor } from '../utils/risk.js';
import MapFitBounds from './MapFitBounds.jsx';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_ZOOM = 3;

/*
 * Keep the map inside the real-world Leaflet boundary.
 * No blank area is reachable by dragging beyond the map's world limits.
 */
const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180],
];

/** Natural map: blue oceans, green/brown terrain (OpenTopoMap) */
const TERRAIN_TILES = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

const TERRAIN_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';

const userIcon = (color, size = 'small') =>
  L.divIcon({
    className: 'suplai-map-marker-wrap',
    html: `
      <span class="suplai-node ${size}" style="--node-color:${color}">
        <span class="suplai-node-halo"></span>
        <span class="suplai-node-ring"></span>
        <span class="suplai-node-core">
          <span class="suplai-node-head"></span>
          <span class="suplai-node-shoulders"></span>
        </span>
      </span>
    `,
    iconSize: size === 'large' ? [38, 38] : [28, 28],
    iconAnchor: size === 'large' ? [19, 19] : [14, 14],
    tooltipAnchor: [0, -18],
  });

/*
 * Draw a smooth curved logistics route between two coordinates.
 * The curve is intentionally stronger and more visible than a straight
 * connection while preserving the existing supplier-to-HQ relationships.
 */
const createArc = (from, to) => {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const points = [];
  const segments = 36;

  /*
   * Keep the route on the same left/right side as the actual target node.
   * Do NOT take a shortest-path longitude across the ±180° seam: that can
   * turn a node that is visibly on the left into a route that exits on the
   * right side of the map.
   */
  const lngDiff = lng2 - lng1;

  const midLat = (lat1 + lat2) / 2;
  const midLng = lng1 + lngDiff / 2;

  const distance = Math.sqrt(
    Math.pow(lat2 - lat1, 2) +
      Math.pow(
        lngDiff * Math.cos((midLat * Math.PI) / 180),
        2,
      ),
  );

  const curve = Math.min(18, Math.max(3.5, distance * 0.085));
  const controlLat = Math.max(
    -78,
    Math.min(
      78,
      midLat + (lat1 <= lat2 ? curve : -curve),
    ),
  );
  const controlLng = midLng;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const oneMinusT = 1 - t;

    const lat =
      oneMinusT * oneMinusT * lat1 +
      2 * oneMinusT * t * controlLat +
      t * t * lat2;

    const lng =
      oneMinusT * oneMinusT * lng1 +
      2 * oneMinusT * t * controlLng +
      t * t * lng2;

    points.push([lat, lng]);
  }

  return points;
};

/* Keeps "-" disabled at the default zoom. */
const MapZoomGuard = () => {
  const map = useMap();

  useEffect(() => {
    const updateMinusButton = () => {
      const minusButton = map
        .getContainer()
        .querySelector('.leaflet-control-zoom-out');

      if (!minusButton) return;

      const atDefaultZoom = map.getZoom() <= DEFAULT_ZOOM;

      minusButton.disabled = atDefaultZoom;
      minusButton.setAttribute(
        'aria-disabled',
        atDefaultZoom ? 'true' : 'false',
      );
      minusButton.style.cursor = atDefaultZoom ? 'not-allowed' : 'pointer';
      minusButton.style.opacity = atDefaultZoom ? '0.5' : '1';
      minusButton.style.pointerEvents = atDefaultZoom ? 'none' : 'auto';
    };

    updateMinusButton();
    map.on('zoomend', updateMinusButton);

    return () => {
      map.off('zoomend', updateMinusButton);
    };
  }, [map]);

  return null;
};

const MapBoundaryGuard = () => {
  const map = useMap();

  useEffect(() => {
    const keepInsideWorld = () => {
      map.panInsideBounds(WORLD_BOUNDS, { animate: false });
    };

    keepInsideWorld();
    map.on('drag', keepInsideWorld);
    map.on('moveend', keepInsideWorld);
    map.on('zoomend', keepInsideWorld);

    return () => {
      map.off('drag', keepInsideWorld);
      map.off('moveend', keepInsideWorld);
      map.off('zoomend', keepInsideWorld);
    };
  }, [map]);

  return null;
};

const MapPanel = ({
  suppliers = [],
  graph,
  companyCoords,
}) => {
  const points = useMemo(() => {
    return suppliers
      .map((supplier) => {
        const coords = resolveCoordinates(supplier);

        if (coords?.lat == null || coords?.lng == null) return null;

        return {
          ...supplier,
          lat: coords.lat,
          lng: coords.lng,
          color: riskColor(supplier.risk_score ?? 0),
        };
      })
      .filter(Boolean);
  }, [suppliers]);

  const hub = useMemo(() => {
    if (companyCoords?.lat != null && companyCoords?.lng != null) {
      return companyCoords;
    }

    const companyNode = graph?.nodes?.find(
      (node) => node.type === 'company',
    );

    if (companyNode) {
      return resolveCoordinates({
        location: companyNode.label,
        id: companyNode.id,
      });
    }

    return null;
  }, [companyCoords, graph]);

  /*
   * Dashboard routes are drawn directly from the company hub to every
   * supplier currently visible on the dashboard. This prevents route
   * segments from disappearing when the graph also contains tier-2,
   * tier-3, or component edges that are not represented by map points.
   */
  const edges = useMemo(() => {
    if (!points.length || !hub) return [];

    return points.map((point) => ({
      id: point.id,
      positions: createArc(
        [hub.lat, hub.lng],
        [point.lat, point.lng],
      ),
    }));
  }, [points, hub]);

  const counts = useMemo(() => {
    const high = points.filter((point) => (point.risk_score ?? 0) >= 60).length;
    const medium = points.filter(
      (point) => (point.risk_score ?? 0) >= 30 && (point.risk_score ?? 0) < 60,
    ).length;
    const low = points.filter((point) => (point.risk_score ?? 0) < 30).length;

    return { high, medium, low, total: points.length };
  }, [points]);

  const mapKey = useMemo(
    () =>
      points.map((point) => point.id).join('-') +
      (hub ? `${hub.lat}-${hub.lng}` : ''),
    [points, hub],
  );

  return (
    <div className="card map-card">
      <div className="map-card-header">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <h3 className="card-title">Global Supply Chain Risk Map</h3>

          <div className="map-legend">
            <span><span className="dot high" /> High</span>
            <span><span className="dot medium" /> Medium</span>
            <span><span className="dot low" /> Low</span>
          </div>
        </div>
      </div>

      <div className="map-viewport">
        <MapContainer
          key={mapKey}
          center={[10, 0]}
          zoom={DEFAULT_ZOOM}
          minZoom={3}
          maxZoom={12}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1}
          inertia
          inertiaDeceleration={5000}
          zoomControl
          dragging
          worldCopyJump={false}
          scrollWheelZoom={false}
          style={{
            height: '100%',
            width: '100%',
            background: '#a8d4f0',
          }}
        >
          <TileLayer
            url={TERRAIN_TILES}
            attribution={TERRAIN_ATTRIBUTION}
            noWrap
          />

          <MapFitBounds />
          <MapBoundaryGuard />
          <MapZoomGuard />

          {hub && (
            <Marker
              position={[hub.lat, hub.lng]}
              icon={userIcon('#0ea5e9', 'large')}
            >
              <Tooltip
                direction="top"
                permanent
                className="suplai-map-tooltip"
              >
                <strong>Company HQ</strong>
              </Tooltip>
            </Marker>
          )}

          {points.map((supplier) => (
            <Marker
              key={supplier.id}
              position={[supplier.lat, supplier.lng]}
              icon={userIcon(supplier.color)}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                permanent
                className={`suplai-map-tooltip ${
                  (supplier.risk_score ?? 0) >= 60
                    ? 'suplai-map-tooltip-risk-high'
                    : 'suplai-map-tooltip-risk-safe'
                }`}
              >
                <strong>{supplier.name}</strong>
                <div>{supplier.location || supplier.country}</div>
                <div>Risk {Math.round(supplier.risk_score ?? 0)}</div>
              </Tooltip>
            </Marker>
          ))}

          {edges.map((route) => (
            <Fragment key={`route-${route.id}`}>
              {/* Soft route glow */}
              <Polyline
                positions={route.positions}
                pathOptions={{
                  color: '#38a9ff',
                  weight: 7,
                  opacity: 0.18,
                  className: 'map-route-glow',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Bold dark route base */}
              <Polyline
                positions={route.positions}
                pathOptions={{
                  color: '#071a31',
                  weight: 3.5,
                  opacity: 0.88,
                  className: 'map-route-base',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* White moving logistics flow */}
              <Polyline
                positions={route.positions}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2.2,
                  opacity: 0.96,
                  className: 'map-route-flow',
                  dashArray: '8 14',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </Fragment>
          ))}
        </MapContainer>
      </div>

      <div className="map-stats">
        <span className="high">{counts.high} High Risk Suppliers</span>
        <span className="medium">{counts.medium} Medium Risk</span>
        <span className="low">{counts.low} Low Risk</span>
        <span>{counts.total} Total Suppliers</span>
      </div>
    </div>
  );
};

export default MapPanel;
