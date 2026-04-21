import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/links', label: 'Links' },
  { path: '/published', label: 'Publicados' },
  { path: '/config', label: 'Config' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">XAmazon</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Bot</span>
        </div>
        <div className="flex gap-1">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
