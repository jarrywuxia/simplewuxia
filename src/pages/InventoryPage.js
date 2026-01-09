import React, { useState, useMemo } from 'react';
import { getItem } from '../data/items';
import { getRarityStyles } from '../utils/rarity';

// 1. Define Rarity Weight for Sorting
const RARITY_WEIGHTS = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythical: 6
};

function InventoryPage({ inventory, onItemClick }) {
  // --- STATE CONTROLS ---
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters (Stackable)
  const [categoryFilter, setCategoryFilter] = useState('ALL'); 
  const [rarityFilter, setRarityFilter] = useState('ALL');
  
  // Sorting
  const [sortBy, setSortBy] = useState('RARITY_DESC'); // 'NAME', 'RARITY_DESC', 'RARITY_ASC', 'QUANTITY'

  // --- LOGIC ---
  const processedInventory = useMemo(() => {
    if (!inventory) return [];

    // A. Map IDs to full objects
    let items = inventory
      .map(slot => {
        const itemDef = getItem(slot.id);
        return itemDef ? { ...itemDef, quantity: slot.quantity } : null;
      })
      .filter(item => item !== null);

    // B. Apply Filters (Stacking Logic)
    items = items.filter(item => {
      // 1. Search Filter
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category Filter
      const matchesCategory = categoryFilter === 'ALL' || item.type === categoryFilter.toLowerCase();
      
      // 3. Rarity Filter
      const matchesRarity = rarityFilter === 'ALL' || item.rarity === rarityFilter.toLowerCase();

      // ALL must be true
      return matchesSearch && matchesCategory && matchesRarity;
    });

    // C. Apply Sorting
    items.sort((a, b) => {
      // Secondary sort is always Name to keep list stable
      const nameCompare = a.name.localeCompare(b.name);

      switch (sortBy) {
        case 'NAME':
          return nameCompare;
        
        case 'RARITY_DESC': // High to Low
          const diffDesc = (RARITY_WEIGHTS[b.rarity] || 0) - (RARITY_WEIGHTS[a.rarity] || 0);
          return diffDesc !== 0 ? diffDesc : nameCompare; // If rarity same, sort by name
        
        case 'RARITY_ASC': // Low to High
          const diffAsc = (RARITY_WEIGHTS[a.rarity] || 0) - (RARITY_WEIGHTS[b.rarity] || 0);
          return diffAsc !== 0 ? diffAsc : nameCompare;

        case 'QUANTITY':
          return b.quantity - a.quantity; // High qty first

        default:
          return nameCompare;
      }
    });

    return items;
  }, [inventory, searchTerm, categoryFilter, rarityFilter, sortBy]);

  // --- RENDER HELPERS ---
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setRarityFilter('ALL');
    setSortBy('RARITY_DESC');
  };

  const activeFilterCount = (categoryFilter !== 'ALL' ? 1 : 0) + (rarityFilter !== 'ALL' ? 1 : 0) + (searchTerm ? 1 : 0);

  return (
    <div className="card min-h-[600px] flex flex-col">
      {/* HEADER & CONTROLS */}
      <div className="border-b border-border pb-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-ink font-serif">Inventory</h2>
          <span className="text-xs font-mono text-ink-light">
            {processedInventory.length} Items Found
          </span>
        </div>
        
        {/* CONTROL PANEL Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          
          {/* 1. Search */}
          <input 
            type="text" 
            placeholder="Search name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 text-xs border border-border bg-stone-50 focus:outline-none focus:border-accent w-full"
          />

          {/* 2. Sort Order */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-border bg-stone-50 focus:outline-none focus:border-accent text-ink font-bold"
          >
            <option value="RARITY_DESC">Sort: Best Rarity</option>
            <option value="RARITY_ASC">Sort: Worst Rarity</option>
            <option value="NAME">Sort: A-Z</option>
            <option value="QUANTITY">Sort: Quantity</option>
          </select>

          {/* 3. Category Filter */}
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 text-xs border focus:outline-none focus:border-accent transition-colors ${categoryFilter !== 'ALL' ? 'bg-accent text-white border-accent' : 'bg-stone-50 border-border text-ink'}`}
          >
            <option value="ALL">Type: All</option>
            <option value="WEAPON">Weapons</option>
            <option value="ARMOR">Armor</option>
            <option value="BOOTS">Boots</option>
            <option value="CONSUMABLE">Pills</option>
            <option value="MANUAL">Manuals</option>
          </select>

          {/* 4. Rarity Filter */}
          <select 
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className={`px-3 py-2 text-xs border focus:outline-none focus:border-accent transition-colors ${rarityFilter !== 'ALL' ? 'bg-accent text-white border-accent' : 'bg-stone-50 border-border text-ink'}`}
          >
            <option value="ALL">Rarity: All</option>
            <option value="COMMON">Common</option>
            <option value="UNCOMMON">Uncommon</option>
            <option value="RARE">Rare</option>
            <option value="EPIC">Epic</option>
            <option value="LEGENDARY">Legendary</option>
          </select>
        </div>

        {/* Active Filter Indicator / Reset */}
        {activeFilterCount > 0 && (
          <div className="flex justify-between items-center mt-2">
            <p className="text-[10px] text-ink-light italic">
              Filtering by: {categoryFilter !== 'ALL' && categoryFilter} {rarityFilter !== 'ALL' && rarityFilter} {searchTerm && `"${searchTerm}"`}
            </p>
            <button onClick={clearFilters} className="text-[10px] text-red-600 font-bold hover:underline">
              Clear Filters (✕)
            </button>
          </div>
        )}
      </div>
      
      {/* GRID DISPLAY */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {processedInventory.length === 0 ? (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <p className="text-ink-light italic text-sm">
              No items match your specific criteria.
            </p>
            <button onClick={clearFilters} className="mt-4 text-accent underline text-xs">Reset Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
            {processedInventory.map((item, index) => {
              const styles = getRarityStyles(item.rarity); 

              return (
                <div 
                  key={`${item.id}-${index}`} 
                  onClick={() => onItemClick(item)} 
                  className={`
                    flex gap-3 p-2 border-2 border-l-[6px] transition-all cursor-pointer group relative overflow-hidden bg-white
                    ${styles.border} hover:shadow-md
                  `}
                >
                  {/* Icon Box */}
                  <div className={`w-12 h-12 bg-stone-50 border ${styles.border} flex items-center justify-center p-1 shrink-0`}>
                    {item.icon ? (
                      <img 
                        src={item.icon} 
                        alt="" 
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }} 
                      />
                    ) : (
                      <span className="text-2xl opacity-20">?</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`font-bold text-xs uppercase tracking-tight truncate ${styles.text}`}>
                        {item.name}
                      </h4>
                      <span className="text-[10px] mono font-bold text-white bg-ink-light/80 px-1.5 rounded-sm">x{item.quantity}</span>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <span className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${styles.text}`}>
                        {item.rarity} {item.type}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest border-b border-transparent group-hover:border-current transition-colors ${styles.text}`}>
                        Inspect
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryPage;