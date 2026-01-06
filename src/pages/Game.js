import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { REALMS } from '../gameData';
import Sidebar from '../components/Sidebar';
import MeditationPage from './MeditationPage';

function Game({ playerData, onPlayerUpdate }) {
  const [currentPage, setCurrentPage] = useState('meditation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-accent text-white p-2 border border-ink hover:bg-accent-light transition-colors"
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>

          {/* Game Title */}
          <h1 className="text-2xl font-bold text-ink font-serif">
            Simple Wuxia
          </h1>

          {/* Spacer for balance (same width as hamburger) */}
          <div className="w-10"></div>
        </div>
      </nav>

      {/* Overlay for when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      {/* Main Content - Centered with max width, below navbar */}
      <div className="p-4 pt-20 max-w-5xl mx-auto">
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
                <p className="font-semibold text-ink mono text-xs">{realmDisplay}</p>
              </div>
              <div>
                <p className="text-ink-light text-xs">XP</p>
                <p className="font-semibold text-ink mono">{playerData.experience}/{playerData.experienceNeeded}</p>
                <div className="w-full bg-gray-200 h-1 border border-border mt-1">
                  <div className="bg-accent h-full transition-all" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-ink-light text-xs mr-1">Stones</p> <img src="/assets/icons/system/SODA_Icon_Orbs_Orb6.png" alt="" width="32" height="32" className="w-5 h-5 inline-block mr-2" style={{imageRendering:'pixelated'}} />
                <p className="font-semibold text-accent mono">{playerData.spiritStones}</p>
              </div>
              <div>
                <p className="text-ink-light text-xs">Energy</p>
                <p className="font-semibold text-ink mono">{playerData.energy}/100</p>
              </div>
            </div>
            
            {playerData.unallocatedPoints > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-accent font-semibold text-sm text-center">
                  ⚡ You have {playerData.unallocatedPoints} unallocated stat points!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div>
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
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-ink-light">Defense:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.defense}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-ink-light">Qi Power:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.qiPower}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-ink-light">Max HP:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.maxHp}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;