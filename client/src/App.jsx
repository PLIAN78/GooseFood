import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CampusMap from './pages/CampusMap';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campus/:slug" element={<CampusMap />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;