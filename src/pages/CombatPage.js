import React from 'react';

function CombatPage() {
  return (
    <div className="card text-center py-20">
      <h2 className="text-2xl font-bold font-serif mb-2 uppercase tracking-widest text-ink">Arena</h2>
      <p className="text-ink-light italic text-sm">Testing your limits soon...</p>
      <div className="mt-8 border p-4 inline-block border-border bg-stone-50">
        <p className="text-xs font-mono">No opponents found in this region.</p>
      </div>
    </div>
  );
}

export default CombatPage;