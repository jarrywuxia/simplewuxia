import React from 'react';
import { auth, db } from './firebase';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Simple Wuxia</h1>
        <p className="text-gray-400">Firebase Connected Successfully!</p>
        <p className="text-sm text-gray-500 mt-2">Ready to start building</p>
      </div>
    </div>
  );
}

export default App;