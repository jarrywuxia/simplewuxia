// src/utils/debug.js
import { useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { itemRegistry } from '../data/items';

/**
 * Attaches 'spawn()' and 'listItems()' to the browser console.
 * Usage: Call this hook in App.js
 */
export const useDebugConsole = (refreshUserData) => {
  useEffect(() => {
    // 1. DEFINE spawn()
    window.spawn = async (itemId) => {
      console.log(`%c[DEV] Spawning: ${itemId}...`, 'color: orange; font-weight: bold;');
      
      try {
        const debugFn = httpsCallable(functions, 'debugGiveItem');
        const result = await debugFn({ itemId });
        
        console.log(`%c[DEV] Success: ${result.data.message}`, 'color: green; font-weight: bold;');
        
        if (refreshUserData) {
            console.log('[DEV] Refreshing UI...');
            await refreshUserData();
        }
        return "Done";
      } catch (err) {
        console.error('[DEV] Spawn Failed:', err.message);
        return "Error";
      }
    };

    // 2. DEFINE listItems()
    window.listItems = () => {
        console.table(Object.values(itemRegistry).map(i => ({
            ID: i.id,
            Name: i.name,
            Type: i.type
        })));
        return "List generated";
    };

    console.log("%c[DEV] Debug Tools Loaded. Type spawn('item_id') or listItems()", 'background: #222; color: #bada55');

    // 3. CLEANUP
    return () => {
      delete window.spawn;
      delete window.listItems;
    };
  }, [refreshUserData]);
};