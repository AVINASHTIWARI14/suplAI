import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
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

const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180],
];

/** Natural map: blue oceans, green/brown terrain (OpenTopoMap) */
const TERRAIN_TILES = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
const TERRAIN_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';

const MapPanel = ({ suppliers = [], graph, companyCoords }) => {
  const points = useMemo(() => {
    return suppliers.map((supplier) => {
      const coords = resolveCoordinates(supplier);
      return {
        ...supplier,
        lat: coords.lat,
        lng: coords.lng,
        color: riskColor(supplier.risk_score ?? 0),
      };
    });
  }, [suppliers]);

  const hub = useMemo(() => {
    if (companyCoords?.lat != null) return companyCoords;
    const companyNode = graph?.nodes?.find((n) => n.type === 'company');
    if (companyNode) {
      return resolveCoordinates({ location: companyNode.label, id: companyNode.id });
    }
    return null;
  }, [companyCoords, graph]);

  const edges = useMemo(() => {
    if (!graph?.edges?.length || !points.length || !hub) return [];
    const byId = Object.fromEntries(points.map((p) => [p.id, p]));

    return graph.edges
      .map((edge) => {
        const target = byId[edge.target];
        if (!target) return null;
        return [
          [hub.lat, hub.lng],
          [target.lat, target.lng],
        ];
      })
      .filter(Boolean);
  }, [graph, points, hub]);

  const counts = useMemo(() => {
    const high = points.filter((p) => (p.risk_score ?? 0) >= 60).length;
    const medium = points.filter((p) => (p.risk_score ?? 0) >= 30 && (p.risk_score ?? 0) < 60).length;
    const low = points.filter((p) => (p.risk_score ?? 0) < 30).length;
    return { high, medium, low, total: points.length };
  }, [points]);

  const mapKey = useMemo(
    () => points.map((p) => p.id).join('-') + (hub ? `${hub.lat}-${hub.lng}` : ''),
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
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={12}
          worldCopyJump={false}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#a8d4f0' }}
        >
          <TileLayer
            url={TERRAIN_TILES}
            attribution={TERRAIN_ATTRIBUTION}
            noWrap
            bounds={WORLD_BOUNDS}
          />
          <MapFitBounds points={points} hub={hub} />

          {hub && (
            <CircleMarker
              center={[hub.lat, hub.lng]}
              radius={11}
              pathOptions={{
                color: '#0ea5e9',
                fillColor: '#38bdf8',
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Tooltip direction="top">
                <strong>Company HQ</strong>
              </Tooltip>
            </CircleMarker>
          )}

          {points.map((supplier) => (
            <CircleMarker
              key={supplier.id}
              center={[supplier.lat, supplier.lng]}
              radius={9}
              pathOptions={{
                color: '#1a1a1a',
                fillColor: supplier.color,
                fillOpacity: 0.92,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{supplier.name}</strong>
                <div>{supplier.location || supplier.country}</div>
                <div>Risk {Math.round(supplier.risk_score ?? 0)}</div>
              </Tooltip>
            </CircleMarker>
          ))}

          {edges.map((positions, index) => (
            <Polyline
              key={`edge-${index}`}
              positions={positions}
              pathOptions={{
                color: '#38bdf8',
                weight: 1.5,
                opacity: 0.5,
                dashArray: '5 7',
              }}
            />
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
