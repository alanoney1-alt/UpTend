import L from 'leaflet';

// Fix Leaflet default marker icon paths broken by Vite bundler
// Using inline SVG data URIs - no external CDN dependencies
const svgIcon = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 2.4.7 4.6 1.9 6.5L12.5 41l10.6-22c1.2-1.9 1.9-4.1 1.9-6.5C25 5.6 19.4 0 12.5 0z" fill="#2563eb"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg>`);

const iconUrl = `data:image/svg+xml,${svgIcon}`;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: iconUrl,
  iconRetinaUrl: iconUrl,
  shadowUrl: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [0, 0],
});
