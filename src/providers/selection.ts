export const usesGeoapify=import.meta.env.VITE_MAP_PROVIDER==='geoapify';
export const placesAttribution=usesGeoapify?'Geoapify · © OpenStreetMap contributors':'Google Maps';
