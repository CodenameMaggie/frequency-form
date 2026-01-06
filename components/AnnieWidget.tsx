'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'annie';
  content: string;
  timestamp: string;
}

export default function AnnieWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate visitor ID on mount
  useEffect(() => {
    const existing = localStorage.getItem('ff_visitor_id');
    if (existing) {
      setVisitorId(existing);
    } else {
      const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('ff_visitor_id', newId);
      setVisitorId(newId);
    }

    // Load conversation from localStorage
    const savedConv = localStorage.getItem('ff_annie_conversation');
    if (savedConv) {
      try {
        const { id, messages: savedMessages } = JSON.parse(savedConv);
        setConversationId(id);
        setMessages(savedMessages);
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation to localStorage
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      localStorage.setItem('ff_annie_conversation', JSON.stringify({
        id: conversationId,
        messages
      }));
    }
  }, [conversationId, messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/bots/annie-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          conversationId,
          visitorId,
          context: {
            pageUrl: window.location.href,
            source: 'website'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const annieMessage: Message = {
          role: 'annie',
          content: data.response,
          timestamp: data.timestamp
        };

        setMessages(prev => [...prev, annieMessage]);
        setConversationId(data.conversationId);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'annie',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or email us at support@frequencyandform.com",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#1a3a2f] text-[#e8dcc4] rounded-full shadow-lg hover:bg-[#2e4a3f] transition-all flex items-center justify-center z-50 group"
        aria-label="Chat with Annie"
      >
        <MessageCircle className="w-7 h-7" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#c9a962] rounded-full animate-pulse" />

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#1a3a2f] text-[#e8dcc4] text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat with Annie, your personal stylist
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-[#d4c8a8]">
      {/* Header */}
      <div className="bg-[#1a3a2f] text-[#e8dcc4] p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c9a962] rounded-full flex items-center justify-center font-serif text-lg text-[#1a3a2f]">
            A
          </div>
          <div>
            <h3 className="font-semibold">Annie</h3>
            <p className="text-xs text-[#c9a962]">Personal Stylist</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:opacity-70 transition-opacity"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#f5f0e4] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <p className="font-serif text-lg text-[#1a3a2f] mb-2">Welcome to Frequency & Form</p>
            <p className="text-sm text-[#5a6a7a]">
              I'm Annie, your personal stylist. I can help you find the perfect natural fiber garments for your frequency goals.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-[#1a3a2f] text-[#e8dcc4]'
                  : 'bg-[#f5f0e4] text-[#1a3a2f] border border-[#d4c8a8]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#f5f0e4] border border-[#d4c8a8] rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#5a6a7a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#5a6a7a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#5a6a7a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#d4c8a8] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about fabrics, styling, or products..."
            className="flex-1 px-4 py-2 border border-[#d4c8a8] rounded-lg text-sm focus:outline-none focus:border-[#1a3a2f] transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-[#1a3a2f] text-[#e8dcc4] rounded-lg hover:bg-[#2e4a3f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[#5a6a7a] mt-2 text-center">
          Annie is here to help with fabric guidance and styling
        </p>
      </div>
    </div>
  );
}
