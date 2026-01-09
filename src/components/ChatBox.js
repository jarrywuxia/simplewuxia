import React, { useState, useEffect, useRef } from 'react';
import { rtdb, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { ref, query, limitToLast, onValue } from 'firebase/database';
import { getItem } from '../data/items';
import { getRarityStyles } from '../utils/rarity';

function ChatBox({ playerData, onViewItem, draftMessage, onDraftConsumed }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // NEW: State for visual cooldown and inline errors
  const [cooldown, setCooldown] = useState(0); 
  const [errorMsg, setErrorMsg] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (draftMessage) {
      setNewMessage((prev) => (prev ? prev + ' ' : '') + draftMessage);
      if (onDraftConsumed) onDraftConsumed();
    }
  }, [draftMessage, onDraftConsumed]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. LISTEN TO MESSAGES
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

  // NEW: Handle the countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 2. SEND MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // Clear previous errors

    // Block if empty, currently sending, or on cooldown
    if (!newMessage.trim() || sending || cooldown > 0) return;

    setSending(true);

    try {
      const sendChatFn = httpsCallable(functions, 'sendChatMessage');
      
      await sendChatFn({ 
        text: newMessage.trim() 
      });

      setNewMessage('');
      setCooldown(3); // Start 3 second client-side cooldown
      
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Handle the specific "Rate Limit" error from Cloud Functions
      if (error.code === 'resource-exhausted' || error.message.includes('too fast')) {
        setErrorMsg("You are chatting too fast.");
        setCooldown(2); // Force cooldown UI if they hit the server limit
      } else {
        setErrorMsg("Failed to send.");
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[item:[a-zA-Z0-9_]+\])/g);
    
    return parts.map((part, i) => {
      const match = part.match(/\[item:([a-zA-Z0-9_]+)\]/);
      if (match) {
        const itemId = match[1];
        const itemDef = getItem(itemId);
        
        if (!itemDef) {
            return <span key={i} className="text-gray-400 text-xs">[Unknown Item]</span>;
        }

        // Get styles
        const styles = getRarityStyles(itemDef.rarity);

        return (
          <button
            key={i}
            onClick={() => onViewItem && onViewItem(itemDef)}
            // CHANGE: Dynamic background, text, and border classes
            className={`
              inline-flex items-center gap-1.5 
              ${styles.text} hover:brightness-75
              ${styles.bg} hover:${styles.bg.replace('50', '100')}
              border ${styles.border}
              cursor-pointer px-1.5 py-0.5 rounded text-xs mx-1 align-text-bottom transition-colors shadow-sm
              font-bold
            `}
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
        
        {/* NEW: Error Message Display */}
        {errorMsg && (
          <div className="text-[10px] text-red-600 font-bold animate-pulse">
            ! {errorMsg}
          </div>
        )}

        <button 
          type="submit" 
          disabled={sending || cooldown > 0} // Disable if sending OR cooling down
          className={`
            w-full py-2 text-xs font-bold transition-colors shadow-sm uppercase tracking-widest
            ${cooldown > 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300' 
              : 'bg-accent text-white hover:bg-accent-light cursor-pointer'
            }
          `}
        >
          {sending ? 'Transmitting...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send to World'}
        </button>
      </form>
    </div>
  );
}

export default ChatBox;