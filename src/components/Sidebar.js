import React from 'react';

function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onClose }) {
  const pages = [
    { id: 'meditation', label: 'Meditation', icon: '🧘' },
    { id: 'combat', label: 'Combat', icon: '⚔️' },
    { id: 'inventory', label: 'Inventory', icon: '🎒' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-white border-r-2 border-border z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
      `}
    >
      <div className="p-4">
        {/* Close button inside sidebar */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-ink font-serif">Menu</h2>
          <button
            onClick={onClose}
            className="text-ink hover:text-accent text-2xl w-8 h-8 flex items-center justify-center"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-2">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className={`
                w-full text-left px-4 py-3 border border-border transition-colors
                ${currentPage === page.id
                  ? 'bg-accent text-white font-semibold'
                  : 'bg-white text-ink hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-2">{page.icon}</span>
              {page.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-4 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full bg-ink hover:bg-ink-light text-white px-4 py-2 border border-ink transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;