import React, { useState, useEffect, useRef } from 'react';
import { rtdb, functions } from '../firebase'; // Import functions
import { httpsCallable } from 'firebase/functions'; // Import callable
import { ref, query, limitToLast, onValue } from 'firebase/database'; // Removed 'push' and 'serverTimestamp'
import { getItem } from '../data/items';

function ChatBox({ playerData, onViewItem, draftMessage, onDraftConsumed }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false); // Add loading state for send
  const chatEndRef = useRef(null);

  // If Game.js sends a draft (e.g. from linking an item), set it here
  useEffect(() => {
    if (draftMessage) {
      setNewMessage((prev) => (prev ? prev + ' ' : '') + draftMessage);
      if (onDraftConsumed) onDraftConsumed(); // Clear the draft in parent
    }
  }, [draftMessage, onDraftConsumed]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. LISTEN TO MESSAGES (Read-Only access is still fine)
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

  // 2. SEND MESSAGE SECURELY VIA CLOUD FUNCTION
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const sendChatFn = httpsCallable(functions, 'sendChatMessage');
      
      // We only send the text. The server figures out the Name, Realm, and Timestamp.
      await sendChatFn({ 
        text: newMessage.trim() 
      });

      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // --- PARSE MESSAGE FOR ITEM LINKS ---
  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Regex to find [item:some_id]
    const parts = text.split(/(\[item:[a-zA-Z0-9_]+\])/g);
    
    return parts.map((part, i) => {
      const match = part.match(/\[item:([a-zA-Z0-9_]+)\]/);
      if (match) {
        const itemId = match[1];
        const itemDef = getItem(itemId);
        
        // Handle invalid IDs
        if (!itemDef) {
           return <span key={i} className="text-gray-400 text-xs">[Unknown Item]</span>;
        }

        return (
          <button
            key={i}
            onClick={() => onViewItem && onViewItem(itemDef)}
            className="inline-flex items-center gap-1.5 text-amber-700 font-bold hover:text-amber-900 cursor-pointer bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 text-xs mx-1 align-text-bottom transition-colors shadow-sm"
            title="Click to view details"
          >
            {itemDef.icon && (
              <img 
                src={itemDef.icon} 
                alt="" 
                className="w-3.5 h-3.5 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            <span>[{itemDef.name}]</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
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
            <div className="text-ink break-words leading-snug bg-white p-2 border border-border shadow-sm">
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t-2 border-border flex flex-col gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Transmit message..."
          className="w-full bg-paper border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
          maxLength={150}
          disabled={sending}
        />
        <button 
          type="submit" 
          disabled={sending}
          className="w-full bg-accent text-white py-2 text-xs font-bold hover:bg-accent-light transition-colors shadow-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Transmitting...' : 'Send to World'}
        </button>
      </form>
    </div>
  );
}

export default ChatBox;