import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 3;

/*
 * Keep Leaflet stable when the dashboard route is mounted inside the
 * scrolling/sticky layout. The map is initialized once, then its size is
 * re-measured after the browser has completed layout and again shortly after.
 * This prevents the classic "only some markers appear until refresh" race.
 */
const MapFitBounds = () => {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const timers = [];

    const refreshMapSize = () => {
      if (!active) return;
      map.invalidateSize({ animate: false });
    };

    map.whenReady(() => {
      if (!active || initializedRef.current) return;

      initializedRef.current = true;
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });

      requestAnimationFrame(() => {
        refreshMapSize();
        requestAnimationFrame(refreshMapSize);
      });

      timers.push(window.setTimeout(refreshMapSize, 120));
      timers.push(window.setTimeout(refreshMapSize, 320));
    });

    const onWindowResize = () => refreshMapSize();
    window.addEventListener('resize', onWindowResize);

    return () => {
      active = false;
      window.removeEventListener('resize', onWindowResize);
      timers.forEach((timer) => window.clearTimeout(timer));
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
