import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './login';
import CharacterCreation from './CharacterCreation';
import Game from './pages/Game';

function App() {
  const [user, setUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if player character exists
        const playerDoc = await getDoc(doc(db, 'players', currentUser.uid));
        if (playerDoc.exists()) {
          setPlayerData(playerDoc.data());
        } else {
          setPlayerData(null); // No character yet
        }
      } else {
        setPlayerData(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const handleCharacterCreated = async () => {
    // Reload player data after character creation
    const playerDoc = await getDoc(doc(db, 'players', user.uid));
    if (playerDoc.exists()) {
      setPlayerData(playerDoc.data());
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink mono">Loading...</p>
      </div>
    );
  }

  // Not logged in - show login
  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Logged in but no character - show character creation
  if (!playerData) {
    return <CharacterCreation user={user} onCharacterCreated={handleCharacterCreated} />;
  }

  // Has character - show game
  return <Game playerData={playerData} onPlayerUpdate={handleCharacterCreated} />;
}

export default App;
