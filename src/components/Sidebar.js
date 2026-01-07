import React from 'react';

function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onClose }) {
  const pages = [
    { id: 'meditation', label: 'Meditation', icon: ' ' },
    { id: 'combat', label: 'Combat', icon: ' ' },
    { id: 'inventory', label: 'Inventory', icon: ' ' },
    { id: 'profile', label: 'Profile', icon: ' ' }
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-paper border-r-2 border-border z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header - matches chat header */}
        <div className="p-4 flex justify-between items-center border-b-2 border-border bg-white h-14 flex-shrink-0">
          <h2 className="text-xl font-bold text-ink font-serif uppercase tracking-widest">Menu</h2>
          <button
            onClick={onClose}
            className="text-ink text-xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Area - matches chat message area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className={`
                w-full text-left px-4 py-3 border transition-all duration-200 shadow-sm
                ${currentPage === page.id
                  ? 'bg-accent border-accent text-white font-bold'
                  : 'bg-white border-border text-ink hover:border-accent hover:bg-white'
                }
              `}
            >
              <span className="mr-3">{page.icon}</span>
              <span className={currentPage === page.id ? '' : 'font-semibold'}>{page.label}</span>
            </button>
          ))}
        </div>

        {/* Logout Button - matches chat input area */}
        <div className="p-4 bg-white border-t-2 border-border flex-shrink-0">
          <button
            onClick={onLogout}
            className="w-full bg-accent text-white py-2 text-xs font-bold hover:bg-accent-light transition-colors shadow-sm uppercase tracking-widest"
          >
            Exit Realm
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;