// src/utils/debug.js
import { useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { itemRegistry } from '../data/items';
import { TECHNIQUE_REGISTRY } from '../data/techniques'; // Import frontend technique data

/**
 * Attaches 'spawn()', 'listItems()', and 'listTechniques()' to the browser console.
 */
export const useDebugConsole = (refreshUserData) => {
  useEffect(() => {
    // 1. DEFINE spawn() - Now handles Items AND Techniques
    window.spawn = async (id) => {
      console.log(`%c[DEV] Spawning: ${id}...`, 'color: orange; font-weight: bold;');
      
      try {
        const debugFn = httpsCallable(functions, 'debugGiveItem');
        const result = await debugFn({ itemId: id }); // We still send key as 'itemId' to match backend
        
        console.log(`%c[DEV] Success: ${result.data.message}`, 'color: green; font-weight: bold;');
        
        if (refreshUserData) {
            console.log('[DEV] Refreshing UI...');
            await refreshUserData();
        }
        return "Done";
      } catch (err) {
        console.error('[DEV] Spawn Failed:', err.message);
        return "Error: " + err.message;
      }
    };

    // 2. DEFINE listItems()
    window.listItems = () => {
        console.table(Object.values(itemRegistry).map(i => ({
            ID: i.id,
            Name: i.name,
            Type: i.type,
            Rarity: i.rarity
        })));
        return "Item List generated";
    };

    // 3. DEFINE listTechniques()
    window.listTechniques = () => {
        console.table(Object.values(TECHNIQUE_REGISTRY).map(t => ({
            ID: t.id,
            Name: t.name,
            Type: t.type,
            Cost: `${t.qiCostBase} + ${t.qiCostPct * 100}%`
        })));
        return "Technique List generated";
    };

    console.log("%c[DEV] Debug Tools Loaded.", 'background: #222; color: #bada55');
    console.log("👉 spawn('id') - Give Item or Learn Skill");
    console.log("👉 listItems() - See Item IDs");
    console.log("👉 listTechniques() - See Skill IDs");

    // 4. CLEANUP
    return () => {
      delete window.spawn;
      delete window.listItems;
      delete window.listTechniques;
    };
  }, [refreshUserData]);
};