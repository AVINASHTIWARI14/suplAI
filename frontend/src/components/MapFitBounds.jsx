import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 3;

/*
 * Sets the dashboard map's initial world view once.
 * Resize events only invalidate Leaflet's size; they never call setView,
 * so the user can freely drag/pan the map without it snapping back.
 */
const MapFitBounds = () => {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;

    map.whenReady(() => {
      if (!active || initializedRef.current) return;

      initializedRef.current = true;
      map.invalidateSize({ animate: false });
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
    });

    return () => {
      active = false;
    };
  }, [map]);

  useEffect(() => {
    const container = map.getContainer();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
};

export default MapFitBounds;
