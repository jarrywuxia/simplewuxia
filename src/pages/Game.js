import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { REALMS } from '../gameData';
import { getItem } from '../data/items';
import Sidebar from '../components/Sidebar';
import MeditationPage from './MeditationPage';
import ChatBox from '../components/ChatBox';
import ItemModal from '../components/ItemModal';

// FIXED ORDER FOR ATTRIBUTES
const STAT_ORDER = ['strength', 'defense', 'qiPower', 'maxHp'];

function Game({ playerData, onPlayerUpdate }) {
  const [currentPage, setCurrentPage] = useState('meditation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // MODAL STATE
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('VIEW'); // 'VIEW' or 'ACTION'
  
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

  // Unified Handler for opening items
  const openItemModal = (item, mode) => {
    setSelectedItem(item);
    setModalMode(mode); // 'VIEW' hides buttons, 'ACTION' shows them
  };

  // --- ACTIONS ---

  const handleAllocateStat = async (statName) => {
    if (actionLoading || playerData.unallocatedPoints <= 0) return;
    setActionLoading(true);
    try {
      const allocateFn = httpsCallable(functions, 'allocateStat');
      await allocateFn({ statName });
      await onPlayerUpdate(); 
    } catch (err) {
      console.error("Allocation failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUseItem = async (itemId) => {
    if (actionLoading || !itemId) return;
    setActionLoading(true);
    try {
      const consumeItem = httpsCallable(functions, 'useItem'); 
      const result = await consumeItem({ itemId });
      console.log(result.data.message); 
      setSelectedItem(null); 
      await onPlayerUpdate(); 
    } catch (err) {
      console.error("Consumption failed:", err);
      alert(err.message || "Failed to use item.");
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
      console.error("Equip failed:", err);
      alert(err.message || "Failed to equip.");
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
      console.error("Unequip failed:", err);
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
  const xpProgress = (playerData.experience / playerData.experienceNeeded) * 100;

  // LOGIC FOR MODAL BUTTONS
  const renderModalActions = () => {
    // 1. If in VIEW mode, show NO buttons (Read Only)
    if (modalMode === 'VIEW') return null;

    // 2. If in ACTION mode, verify ownership
    const count = getItemCount(selectedItem?.id);
    const equipped = isItemEquipped(selectedItem?.id);
    const isOwned = count > 0 || equipped;

    if (!isOwned) return null; // Should not happen in action mode, but safety check

    return (
      <div className="flex flex-col gap-2">
        {/* CONSUME */}
        {selectedItem?.type === 'consumable' && count > 0 && (
          <button 
            disabled={actionLoading}
            onClick={() => handleUseItem(selectedItem.id)}
            className="btn-primary w-full py-2 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {actionLoading ? 'Consuming...' : 'Consume Item'}
          </button>
        )}
        
        {/* EQUIP / UNEQUIP */}
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

        {/* LINK IN CHAT (Only for owned items) */}
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
              onViewItem={(item) => openItemModal(item, 'VIEW')} // CHAT OPENS IN VIEW MODE
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
        actions={renderModalActions()} // DYNAMIC ACTIONS
      />

      <div className="p-4 pt-20 max-w-4xl mx-auto">
        {/* Stats Bar */}
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
                <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Progress</p>
                <div className="w-full bg-gray-200 h-1.5 border border-border mt-1">
                  <div className="bg-accent h-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
              <div className="flex items-center">
                <img src="/assets/icons/system/SODA_Icon_Orbs_Orb6.png" alt="" width="32" height="32" className="w-5 h-5 inline-block mr-2" style={{imageRendering:'pixelated'}} /> 
                <p className="font-semibold text-accent mono">{playerData.spiritStones}</p>
              </div>
              <div>
                <p className="text-ink-light text-[10px] uppercase font-bold tracking-tighter">Energy</p>
                <p className="font-semibold text-ink mono">{playerData.energy}/100</p>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fadeIn">
          {currentPage === 'meditation' && (
            <MeditationPage playerData={playerData} onPlayerUpdate={onPlayerUpdate} />
          )}
          
          {currentPage === 'inventory' && (
            <div className="card min-h-[400px]">
              <h2 className="text-2xl font-bold text-ink mb-6 font-serif border-b border-border pb-2">Bag of Holding</h2>
              {!playerData.inventory || playerData.inventory.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-ink-light italic text-sm">Your bag is empty...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...playerData.inventory]
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map((itemSlot, index) => {
                    const itemDetails = getItem(itemSlot.id);
                    if (!itemDetails) return null;

                    return (
                      <div 
                        key={index} 
                        onClick={() => openItemModal(itemDetails, 'ACTION')} // INVENTORY OPENS IN ACTION MODE
                        className="flex gap-4 p-3 border border-border bg-stone-50 hover:bg-white transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-white border border-border flex items-center justify-center shadow-sm p-1">
                          {itemDetails.icon ? (
                            <img src={itemDetails.icon} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                          ) : (
                            <span className="text-2xl opacity-20">?</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-ink text-xs uppercase tracking-tight">{itemDetails.name}</h4>
                            <span className="text-[10px] mono font-bold text-ink-light">x{itemSlot.quantity}</span>
                          </div>
                          <p className="text-[10px] text-ink-light italic mb-2 leading-tight line-clamp-2">{itemDetails.description}</p>
                          <span className="text-[9px] font-bold text-accent uppercase tracking-widest border-b border-accent/30 group-hover:border-accent transition-colors">
                            Inspect Item
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {currentPage === 'profile' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-ink mb-6 font-serif border-b border-border pb-2">Cultivator Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-4">Attributes</h3>
                  <div className="space-y-4">
                    {STAT_ORDER.map((key) => {
                      const value = playerData.stats[key] || 0;
                      return (
                        <div key={key} className="flex justify-between items-center border-b border-border/50 pb-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-ink capitalize">{key === 'maxHp' ? 'Vitality' : key}</span>
                            <span className="text-[10px] text-ink-light italic leading-none">
                              {key === 'strength' && 'Increases physical damage'}
                              {key === 'defense' && 'Reduces damage taken'}
                              {key === 'qiPower' && 'Increases skill effectiveness'}
                              {key === 'maxHp' && 'Maximum health points'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-ink mono text-lg">{value}</span>
                            {playerData.unallocatedPoints > 0 && (
                              <button 
                                disabled={actionLoading}
                                onClick={() => handleAllocateStat(key)}
                                className="w-8 h-8 bg-accent text-white flex items-center justify-center hover:bg-accent-light transition-colors disabled:opacity-50"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {playerData.unallocatedPoints > 0 && (
                    <div className="mt-6 p-3 bg-accent/5 border border-accent/20 text-center animate-pulse">
                      <p className="text-accent font-bold text-xs uppercase tracking-widest">Available Points: {playerData.unallocatedPoints}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-4">Equipment</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'].map(slot => {
                      const equippedItemId = playerData.equipment?.[slot];
                      const itemData = equippedItemId ? getItem(equippedItemId) : null;

                      return (
                        <div 
                          key={slot} 
                          className={`aspect-square border border-dashed border-border flex flex-col items-center justify-center p-2 bg-stone-50/50 relative group cursor-pointer ${itemData ? 'border-solid border-accent/30 bg-white' : ''}`}
                          onClick={() => itemData && openItemModal(itemData, 'ACTION')} // PROFILE OPENS IN ACTION MODE
                        >
                          {itemData ? (
                            <>
                              <div className="w-10 h-10 mb-1">
                                <img src={itemData.icon} alt={itemData.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                              </div>
                              <span className="text-[9px] font-bold text-ink uppercase tracking-tight truncate w-full text-center">{itemData.name}</span>
                              <span className="text-[8px] text-ink-light uppercase tracking-widest">{slot}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl opacity-10 mb-1">
                                {slot === 'weapon' && ' '}
                                {slot === 'armor' && ' '}
                                {slot === 'helmet' && ' '}
                                {slot === 'boots' && ' '}
                                {slot === 'ring' && ' '}
                                {slot === 'amulet' && ' '}
                              </span>
                              <span className="text-[9px] text-ink-light uppercase opacity-50 tracking-widest">{slot}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 'combat' && (
            <div className="card text-center py-20">
              <h2 className="text-2xl font-bold font-serif mb-2 uppercase tracking-widest text-ink">Arena</h2>
              <p className="text-ink-light italic text-sm">Testing your limits soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;