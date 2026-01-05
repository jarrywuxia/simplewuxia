import React from 'react';

function Navigation({ currentPage, onNavigate }) {
  const pages = [
    { id: 'meditation', label: 'Meditation' },
    { id: 'combat', label: 'Combat' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <nav className="border-b-2 border-border mb-4">
      <div className="flex gap-1">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => onNavigate(page.id)}
            className={`px-4 py-2 border-r border-border transition-colors ${
              currentPage === page.id
                ? 'bg-accent text-white font-semibold'
                : 'bg-white text-ink hover:bg-gray-100'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;