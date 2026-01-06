import React, { useState, useEffect, useRef } from 'react';
import { rtdb } from '../firebase';
import { ref, push, query, limitToLast, onValue, serverTimestamp } from 'firebase/database';

function ChatBox({ playerData }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const chatRef = query(ref(rtdb, 'globalChat'), limitToLast(50));
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(messageList);
        setTimeout(scrollToBottom, 100);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const chatRef = ref(rtdb, 'globalChat');
    await push(chatRef, {
      text: newMessage.trim(),
      senderName: playerData.displayName,
      senderRealm: playerData.realmIndex,
      timestamp: serverTimestamp(),
      userId: playerData.userId
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm animate-fadeIn">
            <div className="flex items-baseline gap-2 mb-1">
               <span className={`font-bold text-xs ${msg.senderRealm > 2 ? 'text-orange-700' : 'text-accent'}`}>
                {msg.senderName}
              </span>
              <span className="text-[9px] text-ink-light mono opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-ink break-words leading-snug bg-white p-2 border border-border shadow-sm">
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area - Stacked Vertically */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t-2 border-border flex flex-col gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Transmit message..."
          className="w-full bg-paper border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
          maxLength={150}
        />
        <button 
          type="submit" 
          className="w-full bg-accent text-white py-2 text-xs font-bold hover:bg-accent-light transition-colors shadow-sm uppercase tracking-widest"
        >
          Send to World
        </button>
      </form>
    </div>
  );
}

export default ChatBox;