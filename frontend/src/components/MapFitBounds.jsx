import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Fits the map once to all markers + company hub, and re-fits on resize
 * so the world does not repeat when the panel is smaller.
 */
const MapFitBounds = ({ points, hub }) => {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      const latLngs = [];

      points.forEach((p) => {
        if (p.lat != null && p.lng != null) latLngs.push([p.lat, p.lng]);
      });
      if (hub?.lat != null && hub?.lng != null) latLngs.push([hub.lat, hub.lng]);

      if (!latLngs.length) {
        map.setView([20, 0], 2, { animate: false });
        return;
      }

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 5, { animate: false });
        return;
      }

      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, {
        padding: [36, 36],
        maxZoom: 5,
        animate: false,
      });
    };

    fit();

    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      fit();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [map, points, hub]);

  return null;
};

export default MapFitBounds;
