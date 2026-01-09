// src/pages/Game.js
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { REALMS } from '../gameData';

// COMPONENTS
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import ItemModal from '../components/ItemModal';

// PAGES
import MeditationPage from './MeditationPage';
import InventoryPage from './InventoryPage';
import ProfilePage from './ProfilePage';
import CombatPage from './CombatPage';
import TechniquesPage from './TechniquesPage'; // ADDED

function Game({ playerData, onPlayerUpdate }) {
  const [currentPage, setCurrentPage] = useState('meditation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // MODAL STATE
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('VIEW'); // 'VIEW' or 'ACTION'
  const [consumeQuantity, setConsumeQuantity] = useState(1); // Track quantity to use
  
  // CHAT DRAFT STATE
  const [chatDraft, setChatDraft] = useState('');

  const handleLogout = async () => {
    await signOut(auth);
  };

  // --- HELPERS ---
  const getItemCount = (itemId) => {
    if (!playerData.inventory) return 0;
    const item = playerData.inventory.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const isItemEquipped = (itemId) => {
    if (!playerData.equipment) return false;
    return Object.values(playerData.equipment).includes(itemId);
  };

  const openItemModal = (item, mode) => {
    setSelectedItem(item);
    setModalMode(mode); 
    setConsumeQuantity(1); // Reset quantity selector when opening
  };

  // --- API ACTIONS ---
  const handleAllocateStat = async (statName) => {
    if (actionLoading || playerData.unallocatedPoints <= 0) return;
    setActionLoading(true);
    try {
      const allocateFn = httpsCallable(functions, 'allocateStat');
      await allocateFn({ statName });
      await onPlayerUpdate(); 
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUseItem = async (itemId, quantity = 1) => {
    if (actionLoading || !itemId) return;
    setActionLoading(true);
    try {
      const consumeItem = httpsCallable(functions, 'useItem'); 
      // Send quantity to backend
      const result = await consumeItem({ itemId, quantity });
      console.log(result.data.message); 
      setSelectedItem(null); 
      await onPlayerUpdate(); 
    } catch (err) {
      alert(err.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEquipItem = async (itemId) => {
    if (actionLoading || !itemId) return;
    setActionLoading(true);
    try {
      const equipFn = httpsCallable(functions, 'equipItem');
      await equipFn({ itemId });
      setSelectedItem(null);
      await onPlayerUpdate();
    } catch (err) {
      alert(err.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnequipItem = async (slot) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const unequipFn = httpsCallable(functions, 'unequipItem');
      await unequipFn({ slot });
      setSelectedItem(null); 
      await onPlayerUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkItem = (item) => {
    if (!item) return;
    setSelectedItem(null); 
    setChatDraft(`[item:${item.id}]`); 
    setIsChatOpen(true); 
    setIsSidebarOpen(false);
  };

  // --- RENDER HELPERS ---
  const currentRealm = REALMS[playerData.realmIndex];
  const currentStage = currentRealm.stages[playerData.stageIndex];
  const realmDisplay = `${currentRealm.name} - ${currentStage}`;
  
  // Calculate XP Progress with clamping
  const rawProgress = (playerData.experience / playerData.experienceNeeded) * 100;
  const xpProgress = Math.min(100, Math.max(0, rawProgress));

  // LOGIC FOR MODAL BUTTONS
  const renderModalActions = () => {
    if (modalMode === 'VIEW') return null;

    const count = getItemCount(selectedItem?.id);
    const equipped = isItemEquipped(selectedItem?.id);
    const isOwned = count > 0 || equipped;

    if (!isOwned) return null;

    return (
      <div className="flex flex-col gap-2">
        {/* CONSUMABLE & MANUAL LOGIC */}
        {(selectedItem?.type === 'consumable' || selectedItem?.type === 'manual') && count > 0 && (
          <div className="bg-stone-50 p-3 border border-border mb-2 rounded shadow-inner">
             {/* Only show Quantity slider if it's NOT a manual (books read 1 at a time) */}
             {selectedItem.type !== 'manual' && (
               <>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-ink-light uppercase tracking-widest">Quantity</span>
                    <span className="text-xs font-mono font-bold text-ink">{consumeQuantity} / {count}</span>
                 </div>
                 {/* ... existing slider code ... */}
               </>
             )}

            <button 
              disabled={actionLoading}
              onClick={() => handleUseItem(selectedItem.id, selectedItem.type === 'manual' ? 1 : consumeQuantity)}
              className="btn-primary w-full py-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {actionLoading 
                ? 'Processing...' 
                : selectedItem.type === 'manual' ? 'Study Manual' : `Consume (${consumeQuantity})`
              }
            </button>
          </div>
        )}
        
        {/* EQUIPMENT LOGIC */}
        {(selectedItem?.type === 'weapon' || selectedItem?.type === 'armor') && (
          <>
            {equipped ? (
              <button 
                disabled={actionLoading}
                onClick={() => handleUnequipItem(selectedItem.slot)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 border border-ink transition-colors uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {actionLoading ? 'Unequipping...' : 'Unequip'}
              </button>
            ) : (
              <button 
                disabled={actionLoading}
                onClick={() => handleEquipItem(selectedItem.id)}
                className="btn-primary w-full py-2 uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {actionLoading ? 'Equipping...' : 'Equip Item'}
              </button>
            )}
          </>
        )}

        <button 
          onClick={() => handleLinkItem(selectedItem)}
          className="w-full bg-white hover:bg-gray-100 text-ink font-semibold py-2 px-4 border border-ink transition-colors uppercase tracking-widest text-xs"
        >
          Link in Chat
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b-2 border-border z-40 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => { setIsSidebarOpen(!isSidebarOpen); setIsChatOpen(false); }}
            className="bg-accent text-white p-2 border border-ink hover:bg-accent-light transition-colors"
          >
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>

          <h1 className="text-xl font-bold text-ink font-serif absolute left-1/2 transform -translate-x-1/2">
            Simple Wuxia
          </h1>

          <button
            onClick={() => { setIsChatOpen(!isChatOpen); setIsSidebarOpen(false); }}
            className="flex items-center gap-2 bg-white text-accent px-3 py-1.5 border border-accent font-bold text-xs"
          >
            <span className="relative flex h-2 w-2 text-accent">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            CHAT
          </button>
        </div>
      </nav>

      {(isSidebarOpen || isChatOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => { setIsSidebarOpen(false); setIsChatOpen(false); }} />
      )}
      
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={(p) => { setCurrentPage(p); setIsSidebarOpen(false); }} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <aside className={`fixed top-0 right-0 h-full bg-paper border-l-2 border-border z-40 transform transition-transform duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} w-72`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-between items-center border-b-2 border-border bg-white h-14 flex-shrink-0">
            <h2 className="text-xl font-bold text-ink font-serif uppercase tracking-widest">Chat</h2>
            <button onClick={() => setIsChatOpen(false)} className="text-ink text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatBox 
              playerData={playerData} 
              onViewItem={(item) => openItemModal(item, 'VIEW')} 
              draftMessage={chatDraft}
              onDraftConsumed={() => setChatDraft('')}
            />
          </div>
        </div>
      </aside>

      {/* SHARED ITEM MODAL */}
      <ItemModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
        actions={renderModalActions()} 
      />

      <div className="p-4 pt-20 max-w-4xl mx-auto">
        {/* Persistent Stats Bar */}
        <div className="mb-6">
          <div className="card shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div>
                <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Cultivator</p>
                <p className="font-bold text-ink mono truncate">{playerData.displayName}</p>
              </div>
              <div>
                <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Realm</p>
                <p className="font-semibold text-ink mono text-[10px]">{realmDisplay}</p>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Progress</p>
                  <p className="text-[9px] mono text-ink-light opacity-80">{playerData.experience} / {playerData.experienceNeeded}</p>
                </div>
                <div className="w-full bg-gray-200 h-1.5 border border-border">
                  <div className="bg-accent h-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
              <div>
                <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Spirit Stones</p>
                <div className="flex items-center">
                  <img src="/assets/icons/system/SODA_Icon_Orbs_Orb6.png" alt="" width="32" height="32" className="w-5 h-5 inline-block mr-2" style={{imageRendering:'pixelated'}} /> 
                  <p className="font-semibold text-accent mono">{playerData.spiritStones}</p>
                </div>
              </div>
              <div>
                <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Energy</p>
                <p className="font-semibold text-ink mono">{playerData.energy}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Page Rendering */}
        <div className="animate-fadeIn">
          {currentPage === 'meditation' && (
            <MeditationPage playerData={playerData} onPlayerUpdate={onPlayerUpdate} />
          )}
          
          {currentPage === 'inventory' && (
            <InventoryPage 
              inventory={playerData.inventory} 
              onItemClick={(item) => openItemModal(item, 'ACTION')} 
            />
          )}

          {currentPage === 'techniques' && (
             <TechniquesPage 
               playerData={playerData} 
               onPlayerUpdate={onPlayerUpdate}
             />
          )}
          
          {currentPage === 'profile' && (
             <ProfilePage 
               playerData={playerData} 
               onAllocateStat={handleAllocateStat}
               onItemClick={(item) => openItemModal(item, 'ACTION')}
               actionLoading={actionLoading}
             />
          )}
          
          {currentPage === 'combat' && <CombatPage playerData={playerData} />}
        </div>
      </div>
    </div>
  );
}

export default Game;