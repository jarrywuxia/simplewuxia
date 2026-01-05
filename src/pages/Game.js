import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { REALMS } from '../gameData';
import Navigation from '../components/Navigation';
import MeditationPage from './MeditationPage';

function Game({ playerData, onPlayerUpdate }) {
  const [currentPage, setCurrentPage] = useState('meditation');

  const handleLogout = async () => {
    await signOut(auth);
  };

  const currentRealm = REALMS[playerData.realmIndex];
  const currentStage = currentRealm.stages[playerData.stageIndex];
  const realmDisplay = `${currentRealm.name} - ${currentStage}`;

  // XP progress percentage
  const xpProgress = (playerData.experience / playerData.experienceNeeded) * 100;

  return (
    <div className="min-h-screen bg-paper p-4 fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-border">
          <h1 className="text-4xl font-bold text-ink font-serif">Simple Wuxia</h1>
          <button
            onClick={handleLogout}
            className="bg-ink hover:bg-ink-light text-white px-4 py-2 border border-ink transition-colors text-sm"
          >
            Logout
          </button>
        </div>
        
        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Sidebar - Character Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Character Info */}
            <div className="card">
              <h2 className="text-2xl font-bold text-ink mb-3 font-serif border-b border-border pb-2">
                {playerData.displayName}
              </h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-ink-light">Realm:</span>
                  <span className="font-semibold text-ink mono text-xs">{realmDisplay}</span>
                </div>
                
                <div>
                  <div className="flex justify-between border-b border-border pb-1 mb-1">
                    <span className="text-ink-light">Experience:</span>
                    <span className="font-semibold text-ink mono">
                      {playerData.experience} / {playerData.experienceNeeded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 border border-border">
                    <div 
                      className="bg-accent h-full transition-all" 
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-ink-light">Spirit Stones:</span>
                  <span className="font-semibold text-accent mono">{playerData.spiritStones}</span>
                </div>
                
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-ink-light">Energy:</span>
                  <span className="font-semibold text-ink mono">
                    {playerData.energy} / 100
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-ink-light">Health:</span>
                  <span className="font-semibold text-ink mono">
                    {playerData.currentHp} / {playerData.stats.maxHp}
                  </span>
                </div>
              </div>
            </div>

            {/* Combat Stats */}
            <div className="card">
              <h3 className="text-xl font-bold text-ink mb-3 font-serif border-b border-border pb-2">
                Combat Stats
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-light">Strength:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.strength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-light">Defense:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-light">Qi Power:</span>
                  <span className="font-semibold text-ink mono">{playerData.stats.qiPower}</span>
                </div>
              </div>
              
              {playerData.unallocatedPoints > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-accent font-semibold text-sm">
                    ⚡ Unallocated Points: {playerData.unallocatedPoints}
                  </p>
                  <button className="btn-primary w-full mt-2 text-sm">
                    Allocate Stats
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
            
            {currentPage === 'meditation' && (
              <MeditationPage playerData={playerData} onPlayerUpdate={onPlayerUpdate} />
            )}
            
            {currentPage === 'combat' && (
              <div className="card">
                <p className="text-ink-light italic">Combat system coming soon...</p>
              </div>
            )}
            
            {currentPage === 'inventory' && (
              <div className="card">
                <p className="text-ink-light italic">Inventory system coming soon...</p>
              </div>
            )}
            
            {currentPage === 'profile' && (
              <div className="card">
                <p className="text-ink-light italic">Profile page coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;