import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EventItem } from '@/types';

function getEventCoordinates(event: EventItem) {
  const description = event.description || '';
  const coordinateMatch = description.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (coordinateMatch) {
    return { lat: Number(coordinateMatch[1]), lng: Number(coordinateMatch[2]) };
  }

  const city = (event.city || event.citySlug || '').toLowerCase();
  const coordinatesByCity: Record<string, { lat: number; lng: number }> = {
    lahore: { lat: 31.5497, lng: 74.3436 },
    karachi: { lat: 24.8607, lng: 67.0011 },
    islamabad: { lat: 33.6844, lng: 73.0479 },
    rawalpindi: { lat: 33.5651, lng: 73.0169 },
    peshawar: { lat: 34.0151, lng: 71.5249 },
    quetta: { lat: 30.1798, lng: 66.9750 },
    multan: { lat: 30.1978, lng: 71.4697 },
    faisalabad: { lat: 31.4187, lng: 73.0791 },
    sialkot: { lat: 32.4932, lng: 74.5314 },
  };

  return coordinatesByCity[city] ?? null;
}

const markerIcon = new L.DivIcon({
  className: 'event-marker-icon',
  html: '<span class="block h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-400 shadow-lg"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function EventsMapView({ events }: { events: EventItem[] }) {
  const points = events.map((event) => ({ event, coordinates: getEventCoordinates(event) })).filter((item) => item.coordinates);

  if (points.length === 0) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
        No map markers are available for the current results.
      </div>
    );
  }

  return (
    <div className="h-[30rem] w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
      <MapContainer center={[30.3753, 69.3451]} zoom={5} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ event, coordinates }) => (
          <Marker key={event.id} position={[coordinates!.lat, coordinates!.lng]} icon={markerIcon}>
            <Popup>
              <div className="space-y-2">
                <p className="font-semibold text-slate-950 dark:text-slate-100">{event.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{event.city || event.citySlug || 'Regional'} • {event.country || event.countryCode || 'Catalog'}</p>
                <a href={`/event/${event.slug}`} className="text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400">Open event</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
