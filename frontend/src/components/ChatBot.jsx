import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your NEXIQ AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userText = input;
    const userMsg = { role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Call backend API
    try {
      const res = await api.chat(userText);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.response 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting right now." 
      }]);
    }
  };

  return (
    <div className="fixed bottom-28 right-8 w-80 max-h-96 bg-surface-container-low backdrop-blur-2xl rounded-2xl border border-outline-variant/20 shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">smart_toy</span>
          <h3 className="font-label-md font-bold text-on-surface">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-xl p-3 font-body-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-on-primary rounded-br-none' 
                : 'bg-surface-container-highest text-on-surface rounded-bl-none'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] text-on-surface-variant mt-1 px-1">
              {msg.role === 'user' ? 'You' : 'NEXIQ AI'}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-surface-container border-t border-outline-variant/10 flex items-center gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 bg-surface-container-highest border-none rounded-lg px-3 py-2 text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50"
        />
        <button 
          onClick={handleSend}
          className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
        </button>
      </div>
    </div>
  );
}
