import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { LOCATIONS } from '../data/locations'; // Make sure you copied the data file!

function LocationPage({ playerData, onPlayerUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentLocId = playerData.currentLocation || 'bamboo_village';
  const location = LOCATIONS[currentLocId] || LOCATIONS['bamboo_village'];

  const handleTravel = async (destId) => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const travelFn = httpsCallable(functions, 'travel');
      await travelFn({ destinationId: destId });
      await onPlayerUpdate();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Travel failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-full flex flex-col">
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
        {/* Description & Image Placeholder */}
        <div className="bg-stone-50 border border-border p-4 mb-6">
           <div className="w-full h-32 bg-gray-200 mb-4 flex items-center justify-center opacity-50">
              <span className="italic text-ink-light">Location Art Placeholder</span>
           </div>
           <p className="text-ink text-sm leading-relaxed italic">
             {location.description}
           </p>
        </div>

        {/* Travel Connections */}
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

        {/* Future Shops/Quests Placeholders */}
        {(location.shopId || location.questIds?.length > 0) && (
          <div className="mt-8 pt-4 border-t border-border border-dashed">
             <h3 className="font-bold text-ink-light text-[10px] uppercase tracking-widest mb-2">Points of Interest</h3>
             <div className="flex gap-2">
                {location.shopId && (
                   <button disabled className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-400 text-xs font-bold rounded">
                      Merchant (Coming Soon)
                   </button>
                )}
                {location.questIds?.length > 0 && (
                   <button disabled className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-400 text-xs font-bold rounded">
                      Quest Board (Coming Soon)
                   </button>
                )}
             </div>
          </div>
        )}
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