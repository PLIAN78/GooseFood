import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const FOOD_COLORS = {
  pizza: '#FF6B2B',
  sushi: '#FF2B6B',
  'bubble tea': '#A855F7',
  vegan: '#22C55E',
  bbq: '#F97316',
  bagels: '#EAB308',
  snacks: '#06B6D4',
  default: '#FF6B2B'
};

function getColor(foodTags) {
  if (!foodTags || foodTags.length === 0) return FOOD_COLORS.default;
  const match = foodTags.find(tag => FOOD_COLORS[tag]);
  return match ? FOOD_COLORS[match] : FOOD_COLORS.default;
}

function MapView({ events, center, onBubbleClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center.lng, center.lat],
      zoom: 15
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Group events by building
    const grouped = {};
    events.forEach(event => {
      const key = event.location.building;
      if (!key || !event.location.lat) return;
      if (!grouped[key]) {
        grouped[key] = {
          lat: event.location.lat,
          lng: event.location.lng,
          events: []
        };
      }
      grouped[key].events.push(event);
    });

    // Create a marker bubble for each building
    Object.entries(grouped).forEach(([building, data]) => {
      const color = getColor(data.events[0].foodTags);
      const count = data.events.length;

      const el = document.createElement('div');
      el.style.cssText = `
        background: ${color};
        color: white;
        border-radius: 50%;
        width: ${40 + count * 8}px;
        height: ${40 + count * 8}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 0 20px ${color}88;
        animation: pulse 2s infinite;
      `;

      const emoji = data.events[0].foodTags?.[0] === 'pizza' ? '🍕'
        : data.events[0].foodTags?.[0] === 'sushi' ? '🍣'
        : data.events[0].foodTags?.[0] === 'bubble tea' ? '🧋'
        : data.events[0].foodTags?.[0] === 'vegan' ? '🥗'
        : data.events[0].foodTags?.[0] === 'bbq' ? '🍖'
        : '🍴';

      el.innerHTML = count > 1 ? `${emoji} ${count}` : emoji;

      el.addEventListener('click', () => onBubbleClick(data.events));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([data.lng, data.lat])
        .addTo(map.current);

      markers.current.push(marker);
    });

  }, [events]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 107, 43, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(255, 107, 43, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 107, 43, 0); }
        }
      `}</style>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </>
  );
}

export default MapView;