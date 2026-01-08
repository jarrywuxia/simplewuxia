import React, { useState } from 'react';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

function CharacterCreation({ user, onCharacterCreated }) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedName = displayName.trim();
    
    // 1. Client-Side Validation (for better UX)
    if (trimmedName.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    
    // Only allow letters, numbers, spaces, underscores
    if (!/^[a-zA-Z0-9_ ]+$/.test(trimmedName)) {
      setError('Name can only contain letters, numbers, spaces, and underscores');
      return;
    }
    
    setLoading(true);
    
    try {
      // 2. Call the Secure Cloud Function
      // The server will handle duplication checks and safe data generation
      const createCharacterFn = httpsCallable(functions, 'createCharacter');
      
      await createCharacterFn({ 
        displayName: trimmedName 
      });
      
      // 3. Success
      onCharacterCreated();
      
    } catch (err) {
      console.error("Creation Error:", err);
      
      // Map server errors to user-friendly messages
      if (err.message.includes('taken')) {
        setError('This name is already taken.');
      } else if (err.message.includes('already exists')) {
        setError('You already have a character.');
      } else if (err.message.includes('Invalid characters')) {
        setError('Invalid characters in name.');
      } else {
        setError('Failed to create character. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 fade-in">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-ink mb-2 font-serif">Simple Wuxia</h1>
          <p className="text-ink-light italic">Begin your cultivation journey</p>
        </div>

        {/* Character Creation Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-ink mb-4 font-serif border-b border-border pb-2">
            Create Your Character
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label 
                htmlFor="characterName" 
                className="block text-ink font-semibold mb-2"
              >
                Cultivator Name
              </label>
              <input
                id="characterName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your unique name..."
                className="w-full px-4 py-2 border-2 border-border bg-white text-ink focus:border-accent focus:outline-none transition-colors"
                disabled={loading}
                maxLength={20}
                required
              />
              <p className="text-ink-light text-xs mt-1">
                3-20 characters · Letters, numbers, spaces, and underscores only
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="border-l-2 border-red-500 pl-3 py-2 bg-red-50">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Welcome Message */}
            <div className="border-l-2 border-accent pl-4 py-2">
              <p className="text-ink-light text-sm italic">
                Your journey begins in the Mortal Realm. Through dedication and perseverance, 
                you shall ascend to greater heights.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Character...' : 'Begin Cultivation'}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-ink-light text-xs mt-4">
          Your cultivator name will be visible to others
        </p>
      </div>
    </div>
  );
}

export default CharacterCreation;