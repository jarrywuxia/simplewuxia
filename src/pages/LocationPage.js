// src/pages/LocationPage.js

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { LOCATIONS } from '../data/locations';
import { SHOPS } from '../data/shops';
import { NPCS } from '../data/npcs';
import { getItem } from '../data/items';
import { getRarityStyles } from '../utils/rarity';

// Import Combat Component to embed it
import CombatPage from './CombatPage'; 
// IMPORT THE NEW COMPONENT
import BoughtPopup from '../components/BoughtPopup';

function LocationPage({ playerData, onPlayerUpdate }) {
  const [mode, setMode] = useState('HUB'); // 'HUB', 'COMBAT', 'TOWN'
  const [subMode, setSubMode] = useState('MENU'); // For Town: 'MENU', 'SHOP', 'NPC'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exploreResult, setExploreResult] = useState(null); 
  
  // NEW STATE: Track active coin popups
  const [coinPopups, setCoinPopups] = useState([]);

  // Current Location Data
  const currentLocId = playerData.currentLocation || 'longtian_village';
  const location = LOCATIONS[currentLocId] || LOCATIONS['longtian_village'];
  
  // --- ACTIONS ---

  const handleTravel = async (destId) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const travelFn = httpsCallable(functions, 'travel');
      await travelFn({ destinationId: destId });
      await onPlayerUpdate();
      setMode('HUB');
      setSubMode('MENU');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = async () => {
    if (loading) return;
    if (playerData.energy < 5) {
        setError('Not enough energy to explore.');
        return;
    }

    setLoading(true);
    setError('');
    setExploreResult(null);

    try {
      const exploreFn = httpsCallable(functions, 'exploreLocation');
      const result = await exploreFn();
      
      if (result.data.enemyId) {
          setExploreResult(result.data); 
          setMode('COMBAT'); 
      } else {
          setError("You found nothing of interest.");
      }

      await onPlayerUpdate();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Exploration failed');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Now accepts price and event object
  const handleBuyItem = async (shopId, itemId, price, e) => {
      if (loading) return;
      
      // Get button coordinates for the popup
      const rect = e.currentTarget.getBoundingClientRect();
      // Center the text horizontally on the button, and place it slightly above
      const startX = rect.left + (rect.width / 2) - 20; 
      const startY = rect.top;

      setLoading(true);
      setError('');
      try {
          const buyFn = httpsCallable(functions, 'buyItem');
          await buyFn({ shopId, itemId });
          await onPlayerUpdate();
          
          // ADD COIN POPUP ON SUCCESS
          const newPopup = {
            id: Date.now(),
            x: startX,
            y: startY,
            text: `-${price}`,
            icon: "/assets/icons/system/SODA_Icon_Orbs_Orb6.png"
          };
          setCoinPopups(prev => [...prev, newPopup]);

      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  // Helper to remove popup after animation finishes
  const removeCoinPopup = (id) => {
    setCoinPopups(prev => prev.filter(cp => cp.id !== id));
  };

  // --- RENDERERS ---

  // 1. COMBAT VIEW
  if (mode === 'COMBAT') {
      return (
          <div className="h-full flex flex-col">
              <div className="mb-2">
                 <button 
                   onClick={() => setMode('HUB')} 
                   className="text-xs font-bold uppercase text-ink-light hover:text-ink underline"
                 >
                    ← Flee to Safety
                 </button>
              </div>
              
              <div className="flex-1 border-2 border-red-900/20 rounded overflow-hidden">
                 <CombatPage 
                    playerData={playerData} 
                    forcedEnemyId={exploreResult?.enemyId}
                 />
              </div>
          </div>
      );
  }

  // 2. TOWN VIEW
  if (mode === 'TOWN') {
      const shop = SHOPS[location.shopId];
      const npc = NPCS[location.npcId];

      return (
          <div className="card h-full flex flex-col animate-fadeIn relative">
              {/* RENDER COIN POPUPS */}
              {coinPopups.map(cp => (
                <BoughtPopup 
                  key={cp.id}
                  x={cp.x}
                  y={cp.y}
                  text={cp.text}
                  color="text-red-600"
                  icon={cp.icon}
                  onComplete={() => removeCoinPopup(cp.id)}
                />
              ))}

              {/* Town Header */}
              <div className="border-b border-border pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-ink font-serif">{location.name} - Town</h2>
                    <p className="text-xs text-ink-light">Safe Zone</p>
                  </div>
                  <button onClick={() => setMode('HUB')} className="btn-secondary text-xs uppercase">
                      Leave Town
                  </button>
              </div>

              {/* Sub-Menu */}
              {subMode === 'MENU' && (
                  <div className="grid grid-cols-2 gap-4">
                      {shop && (
                          <button 
                            onClick={() => setSubMode('SHOP')}
                            className="p-6 border-2 border-border hover:border-accent bg-stone-50 flex flex-col items-center gap-2 group"
                          >
                              <span className="text-4xl group-hover:scale-110 transition-transform">⚖️</span>
                              <span className="font-bold text-ink uppercase tracking-widest">Merchant</span>
                          </button>
                      )}
                      {npc && (
                          <button 
                            onClick={() => setSubMode('NPC')}
                            className="p-6 border-2 border-border hover:border-accent bg-stone-50 flex flex-col items-center gap-2 group"
                          >
                              <span className="text-4xl group-hover:scale-110 transition-transform">{npc.avatar}</span>
                              <span className="font-bold text-ink uppercase tracking-widest">Talk to Elder</span>
                          </button>
                      )}
                  </div>
              )}

              {/* Shop Interface */}
              {subMode === 'SHOP' && shop && (
                  <div className="flex-1 flex flex-col">
                      <button onClick={() => setSubMode('MENU')} className="text-xs mb-4 underline text-ink-light">← Back</button>
                      <h3 className="font-bold text-lg mb-2">{shop.name}</h3>
                      <p className="text-sm italic mb-4 text-ink-light">{shop.description}</p>
                      
                      <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[400px]">
                          {shop.inventory.map((listing, i) => {
                              const item = getItem(listing.itemId);
                              if (!item) return null;
                              const styles = getRarityStyles(item.rarity);
                              const canAfford = playerData.spiritStones >= listing.price;

                              return (
                                  <div key={i} className={`flex justify-between items-center p-2 border ${styles.border} bg-white`}>
                                      <div className="flex items-center gap-3">
                                          <img src={item.icon} alt="" className="w-8 h-8 object-contain border p-0.5" />
                                          <div>
                                              <div className={`text-xs font-bold ${styles.text}`}>{item.name}</div>
                                              <div className="text-[10px] text-ink-light">{item.description}</div>
                                          </div>
                                      </div>
                                      <button 
                                        // UPDATED: Pass price and event (e)
                                        onClick={(e) => handleBuyItem(location.shopId, item.id, listing.price, e)}
                                        disabled={!canAfford || loading}
                                        className={`px-3 py-1 text-xs font-bold border flex items-center gap-1 active:scale-95 transition-transform
                                            ${canAfford 
                                                ? 'bg-accent text-white border-accent hover:bg-accent-light' 
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            }`}
                                      >
                                          <span>{listing.price}</span>
                                          <img 
                                            src="/assets/icons/system/SODA_Icon_Orbs_Orb6.png" 
                                            alt="Spirit Stones" 
                                            className="w-3 h-3 object-contain inline-block"
                                            style={{ imageRendering: 'pixelated' }}
                                          />
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              {/* NPC Interface */}
              {subMode === 'NPC' && npc && (
                  <div className="flex-1 flex flex-col">
                      <button onClick={() => setSubMode('MENU')} className="text-xs mb-4 underline text-ink-light">← Back</button>
                      <div className="flex items-center gap-4 mb-6">
                          <div className="text-6xl border-2 border-border p-2 bg-stone-50">{npc.avatar}</div>
                          <div>
                              <h3 className="font-bold text-xl">{npc.name}</h3>
                              <p className="text-xs text-accent font-bold uppercase tracking-widest">{npc.title}</p>
                          </div>
                      </div>
                      <div className="bg-white p-4 border border-border shadow-inner">
                          <p className="text-ink font-serif italic text-lg leading-relaxed">
                              "{npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)]}"
                          </p>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // 3. DEFAULT: HUB VIEW (Wilderness)
  return (
    <div className="card h-full flex flex-col">
      {/* Location Header */}
      <div className="border-b border-border pb-4 mb-4">
        <h2 className="text-2xl font-bold text-ink font-serif">{location.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border 
            ${location.type === 'safe_zone' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {location.type.replace('_', ' ')}
          </span>
          {location.requirements?.minRealm > 0 && (
             <span className="text-[10px] text-ink-light">Realm Lv.{location.requirements.minRealm}+</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Description & Image */}
        <div className="bg-stone-50 border border-border p-4 mb-6 relative overflow-hidden group">
           <div className="w-full h-32 bg-gray-200 mb-4 flex items-center justify-center opacity-50 overflow-hidden">
               <img 
                 src={location.id.includes('forest') ? '/assets/backgrounds/meditation_bg.png' : '/assets/backgrounds/meditation_bg.png'} 
                 className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                 alt=""
               />
           </div>
           <p className="text-ink text-sm leading-relaxed italic relative z-10">
             {location.description}
           </p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Explore Button */}
            <button 
                onClick={handleExplore}
                disabled={loading}
                className="p-4 border-2 border-red-800 bg-red-50 hover:bg-red-100 text-red-900 transition-colors flex flex-col items-center gap-1 group"
            >
                <span className="text-2xl group-hover:scale-110 transition-transform">⚔️</span>
                <span className="font-bold uppercase tracking-widest">Explore Area</span>
                <span className="text-[10px] opacity-70">-5 Energy</span>
            </button>

            {/* Town Button (Only if valid) */}
            {(location.shopId || location.npcId) && (
                 <button 
                    onClick={() => { setMode('TOWN'); setSubMode('MENU'); }}
                    className="p-4 border-2 border-blue-800 bg-blue-50 hover:bg-blue-100 text-blue-900 transition-colors flex flex-col items-center gap-1 group"
                >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🏘️</span>
                    <span className="font-bold uppercase tracking-widest">Enter Town</span>
                    <span className="text-[10px] opacity-70">Safe Zone</span>
                </button>
            )}
        </div>

        {/* TRAVEL CONNECTIONS */}
        <h3 className="font-bold text-ink text-xs uppercase tracking-widest mb-3">Travel Connections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {location.connectedTo.map(destId => {
            const dest = LOCATIONS[destId];
            if(!dest) return null;
            const canEnter = (playerData.realmIndex || 0) >= (dest.requirements?.minRealm || 0);

            return (
              <button
                key={destId}
                onClick={() => handleTravel(destId)}
                disabled={loading || !canEnter}
                className={`
                  text-left p-3 border transition-all relative group
                  ${canEnter 
                    ? 'bg-white border-border hover:border-accent hover:shadow-sm' 
                    : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'}
                `}
              >
                <div className="flex justify-between items-center">
                   <span className="font-bold text-sm text-ink">{dest.name}</span>
                   {!canEnter && <span className="text-[9px] text-red-600 font-bold">LOCKED</span>}
                </div>
                <p className="text-[10px] text-ink-light truncate mt-1">{dest.description}</p>
              </button>
            );
          })}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-2 bg-red-50 border-l-2 border-red-500 text-red-700 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}

export default LocationPage;