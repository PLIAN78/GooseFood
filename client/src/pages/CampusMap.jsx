import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvents, getUniversities } from '../api/events';
import MapView from '../components/MapView';

function CampusMap() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState(null);
  const [filters, setFilters] = useState({ food: '', source: '', time: '' });

  // Fetch university info
  useEffect(() => {
    getUniversities().then(res => {
      const uni = res.data.find(u => u.slug === slug);
      if (!uni) navigate('/');
      setUniversity(uni);
    });
  }, [slug]);

  // Fetch events when filters change
  useEffect(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    );
    getEvents(slug, activeFilters)
      .then(res => setEvents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug, filters]);

  const center = university
    ? { lat: university.lat, lng: university.lng }
    : { lat: 43.4723, lng: -80.5449 };

  return (
    <div style={styles.container}>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2 style={styles.uniName}>{university?.name}</h2>
        <p style={styles.eventCount}>{events.length} free food events</p>

        {/* Filters */}
        <div style={styles.filters}>
          <select
            style={styles.select}
            value={filters.time}
            onChange={e => setFilters(f => ({ ...f, time: e.target.value }))}
          >
            <option value="">⏰ Any time</option>
            <option value="now">🔴 Happening now</option>
            <option value="today">📅 Today</option>
            <option value="week">📆 This week</option>
          </select>

          <select
            style={styles.select}
            value={filters.source}
            onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
          >
            <option value="">📡 Any source</option>
            <option value="discord">💬 Discord</option>
            <option value="instagram">📸 Instagram</option>
          </select>

          <select
            style={styles.select}
            value={filters.food}
            onChange={e => setFilters(f => ({ ...f, food: e.target.value }))}
          >
            <option value="">🍴 Any food</option>
            <option value="pizza">🍕 Pizza</option>
            <option value="sushi">🍣 Sushi</option>
            <option value="bubble tea">🧋 Bubble Tea</option>
            <option value="vegan">🥗 Vegan</option>
            <option value="bbq">🍖 BBQ</option>
            <option value="snacks">🍿 Snacks</option>
          </select>
        </div>

        {/* Event Cards */}
        <div style={styles.eventList}>
          {loading ? (
            <p style={styles.msg}>Loading events...</p>
          ) : events.length === 0 ? (
            <p style={styles.msg}>No events found 😔</p>
          ) : (
            events.map(event => (
              <div
                key={event.id}
                style={styles.card}
                onClick={() => setSelectedEvents([event])}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B2B'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}
              >
                <div style={styles.cardTop}>
                  <span style={styles.sourceTag}>{event.source}</span>
                  <span style={styles.time}>
                    {new Date(event.eventTime).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <h3 style={styles.cardTitle}>{event.title}</h3>
                <p style={styles.cardBuilding}>📍 {event.location.building}</p>
                <div style={styles.tags}>
                  {event.foodTags.map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map */}
      <div style={styles.mapContainer}>
        {university && (
          <MapView
            events={events}
            center={center}
            onBubbleClick={setSelectedEvents}
          />
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvents && (
        <div style={styles.overlay} onClick={() => setSelectedEvents(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedEvents(null)}>✕</button>
            {selectedEvents.map(event => (
              <div key={event.id} style={styles.modalEvent}>
                <h2 style={styles.modalTitle}>{event.title}</h2>
                <p style={styles.modalDesc}>{event.description}</p>
                <p style={styles.modalMeta}>📍 {event.location.building}</p>
                <p style={styles.modalMeta}>
                  🕐 {new Date(event.eventTime).toLocaleString()}
                </p>
                <p style={styles.modalMeta}>📡 Source: {event.source}</p>
                <div style={styles.tags}>
                  {event.foodTags.map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#0D1117',
    overflow: 'hidden',
  },
  sidebar: {
    width: '360px',
    minWidth: '360px',
    height: '100vh',
    background: '#161b22',
    borderRight: '1px solid #30363d',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    overflowY: 'auto',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#FF6B2B',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0',
    marginBottom: '1rem',
    textAlign: 'left',
  },
  uniName: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '0.25rem',
  },
  eventCount: {
    fontSize: '0.85rem',
    color: '#8b949e',
    marginBottom: '1rem',
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  select: {
    background: '#0D1117',
    border: '1px solid #30363d',
    color: '#ffffff',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
  },
  card: {
    background: '#0D1117',
    border: '1px solid #30363d',
    borderRadius: '10px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  sourceTag: {
    fontSize: '0.7rem',
    background: '#FF6B2B22',
    color: '#FF6B2B',
    padding: '2px 8px',
    borderRadius: '999px',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: '0.75rem',
    color: '#8b949e',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '0.25rem',
  },
  cardBuilding: {
    fontSize: '0.8rem',
    color: '#8b949e',
    marginBottom: '0.5rem',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
  },
  tag: {
    fontSize: '0.7rem',
    background: '#30363d',
    color: '#8b949e',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  mapContainer: {
    flex: 1,
    height: '100vh',
  },
  msg: {
    color: '#8b949e',
    textAlign: 'center',
    marginTop: '2rem',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '480px',
    width: '90%',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: '#8b949e',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  modalEvent: {
    marginBottom: '1rem',
  },
  modalTitle: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '0.5rem',
  },
  modalDesc: {
    color: '#8b949e',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  modalMeta: {
    color: '#8b949e',
    fontSize: '0.85rem',
    marginBottom: '0.35rem',
  },
};

export default CampusMap;