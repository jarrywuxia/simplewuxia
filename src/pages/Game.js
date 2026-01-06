import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { REALMS } from '../gameData';
import Sidebar from '../components/Sidebar';
import MeditationPage from './MeditationPage';
import ChatBox from '../components/ChatBox';

function Game({ playerData, onPlayerUpdate }) {
  const [currentPage, setCurrentPage] = useState('meditation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const currentRealm = REALMS[playerData.realmIndex];
  const currentStage = currentRealm.stages[playerData.stageIndex];
  const realmDisplay = `${currentRealm.name} - ${currentStage}`;
  const xpProgress = (playerData.experience / playerData.experienceNeeded) * 100;

  return (
    <div className="min-h-screen bg-paper">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b-2 border-border z-40 h-14">
        <div className="flex items-center justify-between h-full px-4">
          
          {/* LEFT: Menu Button */}
          <button
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              setIsChatOpen(false); // Close chat if menu opens
            }}
            className="bg-accent text-white p-2 border border-ink hover:bg-accent-light transition-colors"
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>

          {/* CENTER: Title */}
          <h1 className="text-xl font-bold text-ink font-serif absolute left-1/2 transform -translate-x-1/2">
            Simple Wuxia
          </h1>

          {/* RIGHT: Chat Button with Pulsing Dot */}
          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setIsSidebarOpen(false); // Close menu if chat opens
            }}
            className="flex items-center gap-2 bg-white text-accent px-3 py-1.5 border border-accent hover:bg-stone-50 transition-colors font-bold text-xs"
          >
            {/* The Pulsing Notification Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            CHAT
          </button>
        </div>
      </nav>

      {/* Unified Overlay */}
      {(isSidebarOpen || isChatOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsChatOpen(false);
          }}
        />
      )}

      {/* LEFT SIDEBAR (Menu) */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false);
        }}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* RIGHT SIDEBAR (Chat) - Styled like the Menu Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full bg-paper border-l-2 border-border z-40
          transform transition-transform duration-300 ease-in-out
          ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header matching your menu style */}
          <div className="p-4 flex justify-between items-center border-b-2 border-border bg-white">
            <h2 className="text-2xl font-bold text-ink font-serif uppercase tracking-widest">Chat</h2>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-ink hover:text-accent text-2xl w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <ChatBox playerData={playerData} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="p-4 pt-20 max-w-4xl mx-auto">
        {/* Stats bar */}
        <div className="mb-6">
          <div className="card">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div>
                <p className="text-ink-light text-xs">Cultivator</p>
                <p className="font-bold text-ink mono truncate">{playerData.displayName}</p>
              </div>
              <div>
                <p className="text-ink-light text-xs">Realm</p>
                <p className="font-semibold text-ink mono text-[10px]">{realmDisplay}</p>
              </div>
              <div>
                <p className="text-ink-light text-xs">XP</p>
                <p className="font-semibold text-ink mono">{playerData.experience}/{playerData.experienceNeeded}</p>
                <div className="w-full bg-gray-200 h-1 border border-border mt-1">
                  <div className="bg-accent h-full transition-all" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-ink-light text-xs mr-1">Stones</p> 
                <img src="/assets/icons/system/SODA_Icon_Orbs_Orb6.png" alt="" width="32" height="32" className="w-5 h-5 inline-block mr-2" style={{imageRendering:'pixelated'}} />
                <p className="font-semibold text-accent mono">{playerData.spiritStones}</p>
              </div>
              <div>
                <p className="text-ink-light text-xs">Energy</p>
                <p className="font-semibold text-ink mono">{playerData.energy}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="animate-fadeIn">
          {currentPage === 'meditation' && (
            <MeditationPage playerData={playerData} onPlayerUpdate={onPlayerUpdate} />
          )}
          
          {currentPage === 'combat' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-ink mb-4 font-serif">Combat Arena</h2>
              <p className="text-ink-light italic">Combat system coming soon...</p>
            </div>
          )}
          
          {currentPage === 'inventory' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-ink mb-4 font-serif">Inventory</h2>
              <p className="text-ink-light italic">Inventory system coming soon...</p>
            </div>
          )}
          
          {currentPage === 'profile' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-ink mb-4 font-serif">Profile</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-ink-light">Strength:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.strength}</span>
                </div>
                {/* ... other stats ... */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;