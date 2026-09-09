import { useState } from 'react';
import { inBengaluru, type JourneyPoint } from './domain/journey';
import { PlaceSearch } from './PlaceSearch';
import { Favourites } from './Favourites';
export function PointPicker({ value, onChoose, accessCode='' }: { value: JourneyPoint; onChoose: (point: JourneyPoint) => void; accessCode?:string }) {
  const [name, setName] = useState(value.name), [latitude, setLatitude] = useState(String(value.latitude)), [longitude, setLongitude] = useState(String(value.longitude)), [error, setError] = useState('');
  return <><p className="sheet-intro">Find a demo location or search for another place in Bengaluru.</p>
    <PlaceSearch onChoose={onChoose} accessCode={accessCode}/>
    <Favourites point={value} onChoose={onChoose} accessCode={accessCode}/>
    <form className="coordinate-form" onSubmit={e => { e.preventDefault(); const point = { name: name.trim(), latitude: Number(latitude), longitude: Number(longitude) }; if (!point.name || !latitude.trim() || !longitude.trim() || !inBengaluru(point)) setError('Enter a name and valid Bengaluru coordinates.'); else onChoose(point); }}>
      <label>Place name<input value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
      <label>Latitude<input value={latitude} onChange={e => setLatitude(e.target.value)} inputMode="decimal" required /></label>
      <label>Longitude<input value={longitude} onChange={e => setLongitude(e.target.value)} inputMode="decimal" required /></label>
      {error && <p role="alert">{error}</p>}<button className="secondary-button" type="submit">Use this pin</button>
    </form><p className="settings-helper">Check the public gate and road entrance in Google Maps before travel.</p></>;
}
