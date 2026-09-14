import { useState } from 'react';
import { inPilotArea, type JourneyPoint } from './domain/journey';
import { PlaceSearch } from './PlaceSearch';
import { Favourites } from './Favourites';
import type { SearchDirection } from './domain/search';
export function PointPicker({ value, onChoose, accessCode='', anchor, direction, mode='DRIVE', departureTime }: { value: JourneyPoint; onChoose: (point: JourneyPoint) => void; accessCode?:string; anchor:JourneyPoint; direction:SearchDirection; mode?:import('./domain/types').TravelMode; departureTime?:string }) {
  const [name, setName] = useState(value.name), [latitude, setLatitude] = useState(String(value.latitude)), [longitude, setLongitude] = useState(String(value.longitude)), [error, setError] = useState('');
  return <><p className="sheet-intro">Search near your journey endpoint in North Bengaluru or Kanpur. Ordinary streets and neighbourhoods are supported too.</p>
    <PlaceSearch mode={mode} departureTime={departureTime} onChoose={onChoose} accessCode={accessCode} anchor={anchor} direction={direction}/>
    <Favourites point={value} onChoose={onChoose} accessCode={accessCode}/>
    <form className="coordinate-form" onSubmit={e => { e.preventDefault(); const point = { name: name.trim(), latitude: Number(latitude), longitude: Number(longitude) }; if (!point.name || !latitude.trim() || !longitude.trim() || !inPilotArea(point)) setError('Enter a name and coordinates in the supported North Bengaluru or Kanpur area.'); else onChoose(point); }}>
      <label>Place name<input value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
      <label>Latitude<input value={latitude} onChange={e => setLatitude(e.target.value)} inputMode="decimal" required /></label>
      <label>Longitude<input value={longitude} onChange={e => setLongitude(e.target.value)} inputMode="decimal" required /></label>
      {error && <p role="alert">{error}</p>}<button className="secondary-button" type="submit">Use this pin</button>
    </form><p className="settings-helper">Check the public gate and road entrance in Google Maps before travel.</p></>;
}
