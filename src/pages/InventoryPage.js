import React, { useState, useMemo } from 'react';
import { getItem } from '../data/items';

function InventoryPage({ inventory, onItemClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, WEAPON, ARMOR, CONSUMABLE

  // Process inventory: Merge quantity data with static item data
  // useMemo ensures we don't recalculate this on every render unless inventory changes
  const processedInventory = useMemo(() => {
    if (!inventory) return [];
    
    return inventory
      .map(slot => {
        const itemDef = getItem(slot.id);
        return itemDef ? { ...itemDef, quantity: slot.quantity } : null;
      })
      .filter(item => item !== null); // Remove invalid items
  }, [inventory]);

  // Handle Filtering and Searching
  const filteredItems = processedInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="card min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-border pb-4 gap-4">
        <h2 className="text-2xl font-bold text-ink font-serif">Bag of Holding</h2>
        
        {/* Search & Filter Controls */}
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 text-sm border border-border bg-stone-50 focus:outline-none focus:border-accent w-full md:w-40"
          />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 text-sm border border-border bg-stone-50 focus:outline-none focus:border-accent text-ink"
          >
            <option value="ALL">All</option>
            <option value="WEAPON">Weapons</option>
            <option value="ARMOR">Armor</option>
            <option value="CONSUMABLE">Pills</option>
          </select>
        </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <p className="text-ink-light italic text-sm">
            {searchTerm ? "No items found matching your search." : "Your bag is empty..."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems
            .sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical sort
            .map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              onClick={() => onItemClick(item)} 
              className="flex gap-4 p-3 border border-border bg-stone-50 hover:bg-white transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-white border border-border flex items-center justify-center shadow-sm p-1">
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
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-ink text-xs uppercase tracking-tight">{item.name}</h4>
                  <span className="text-[10px] mono font-bold text-ink-light">x{item.quantity}</span>
                </div>
                <p className="text-[10px] text-ink-light italic mb-2 leading-tight line-clamp-2">
                  {item.description}
                </p>
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest border-b border-accent/30 group-hover:border-accent transition-colors">
                  Inspect Item
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InventoryPage;