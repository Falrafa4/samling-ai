import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon assets issue in bundlers (Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function LeafletMap({ lat = -7.4478, lng = 112.7183, zoom = 13, popupText }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([lat, lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    } else {
      // If map exists, update view
      mapRef.current.setView([lat, lng], zoom);
    }

    // Add or update marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);

    if (popupText) {
      markerRef.current.bindPopup(popupText).openPopup();
    }

    // Handle invalidation of size on render
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    // Cleanup
    return () => {
      // We don't remove map completely if we want to reuse,
      // but since standard React lifecycle might mount/unmount page modals,
      // destroying and re-creating is safer.
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng, zoom, popupText]);

  return (
    <div className="w-full h-full relative z-0">
      <div ref={mapContainerRef} className="w-full h-full border border-gray-100 dark:border-slate-800 rounded-xl" />
    </div>
  );
}
