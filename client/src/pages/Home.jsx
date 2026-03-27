import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUniversities } from '../api/events';

function Home() {
  const [universities, setUniversities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getUniversities()
      .then(res => setUniversities(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>🍕 GooseFood</h1>
        <p style={styles.subtitle}>Free food. Right now. On your campus.</p>

        <input
          style={styles.search}
          type="text"
          placeholder="Search your university..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={styles.loading}>Loading universities...</p>
      ) : (
        <div style={styles.grid}>
          {filtered.map(uni => (
            <div
              key={uni.id}
              style={styles.card}
              onClick={() => navigate(`/campus/${uni.slug}`)}
              onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
              onMouseLeave={e => e.currentTarget.style.background = '#161b22'}
            >
              <div style={styles.cardEmoji}>🏫</div>
              <h2 style={styles.cardTitle}>{uni.name}</h2>
              <p style={styles.cardSub}>View free food events →</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0D1117',
    padding: '3rem 2rem',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#FF6B2B',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#8b949e',
    marginBottom: '2rem',
  },
  search: {
    width: '100%',
    maxWidth: '500px',
    padding: '0.75rem 1.25rem',
    borderRadius: '999px',
    border: '1px solid #30363d',
    background: '#161b22',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  card: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '2rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    textAlign: 'center',
  },
  cardEmoji: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '0.5rem',
  },
  cardSub: {
    fontSize: '0.85rem',
    color: '#FF6B2B',
  },
  loading: {
    textAlign: 'center',
    color: '#8b949e',
  }
};

export default Home;