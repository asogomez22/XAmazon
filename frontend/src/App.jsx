import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import Published from './pages/Published';
import Config from './pages/Config';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/links" element={<Links />} />
          <Route path="/published" element={<Published />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </main>
    </div>
  );
}
