'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  conversation_id: string;
  visitor_id: string;
  customer_name: string | null;
  customer_email: string | null;
  started_at: string;
  last_message_at: string;
  status: string;
  message_count: number;
  last_message_preview: string;
}

interface Message {
  id: string;
  role: string;
  message: string;
  intent: string | null;
  created_at: string;
}

export default function AdminConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, resolved

  useEffect(() => {
    loadConversations();
  }, [filter]);

  async function loadConversations() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/annie-conversations?status=${filter}`);
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const res = await fetch(`/api/admin/annie-conversations/${conversationId}/messages`);
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    loadMessages(conv.id);
  }

  async function updateConversationStatus(convId: string, status: string) {
    try {
      const res = await fetch(`/api/admin/annie-conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        loadConversations();
        if (selectedConv?.id === convId) {
          setSelectedConv({ ...selectedConv, status });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e4]">
      {/* Header */}
      <div className="bg-[#1e2a3a] text-white py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-light tracking-wider mb-1">Annie Conversations</h1>
            <p className="text-[#b8a888] text-sm">Customer Service Dashboard</p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-[#d4c8a8] text-[#1e2a3a] rounded hover:bg-[#c9a962] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#5a6a7a]">Filter:</span>
            <div className="flex gap-2">
              {['all', 'active', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded text-sm transition-colors ${
                    filter === f
                      ? 'bg-[#1e2a3a] text-white'
                      : 'bg-[#f5f0e4] text-[#1e2a3a] hover:bg-[#e8dcc4]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-[#5a6a7a]">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#f5f0e4] p-4 border-b border-[#e8dcc4]">
              <h2 className="font-serif text-lg text-[#1e2a3a]">Conversations</h2>
            </div>

            <div className="overflow-y-auto max-h-[700px]">
              {loading ? (
                <div className="p-8 text-center text-[#5a6a7a]">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-[#5a6a7a]">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 border-b border-[#e8dcc4] cursor-pointer transition-colors ${
                      selectedConv?.id === conv.id
                        ? 'bg-[#f5f0e4]'
                        : 'hover:bg-[#faf8f3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-[#1e2a3a]">
                        {conv.customer_name || conv.customer_email || `Visitor ${conv.visitor_id.slice(8, 16)}`}
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          conv.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {conv.status}
                      </div>
                    </div>

                    <div className="text-sm text-[#5a6a7a] mb-2 line-clamp-2">
                      {conv.last_message_preview}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#9a8a7a]">
                      <span>{conv.message_count} messages</span>
                      <span>{new Date(conv.last_message_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages View */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <div className="bg-[#f5f0e4] p-4 border-b border-[#e8dcc4]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-lg text-[#1e2a3a] mb-1">
                        {selectedConv.customer_name || selectedConv.customer_email || `Visitor ${selectedConv.visitor_id.slice(8, 16)}`}
                      </h2>
                      <p className="text-sm text-[#5a6a7a]">
                        Started {new Date(selectedConv.started_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {selectedConv.status === 'active' && (
                        <button
                          onClick={() => updateConversationStatus(selectedConv.id, 'resolved')}
                          className="px-4 py-2 bg-[#1e2a3a] text-white rounded text-sm hover:bg-[#2e3a4a] transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {selectedConv.status === 'resolved' && (
                        <button
                          onClick={() => updateConversationStatus(selectedConv.id, 'active')}
                          className="px-4 py-2 bg-[#c9a962] text-white rounded text-sm hover:bg-[#b89952] transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#faf8f3]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          msg.role === 'customer'
                            ? 'bg-[#1e2a3a] text-white'
                            : 'bg-white border border-[#e8dcc4] text-[#1e2a3a]'
                        }`}
                      >
                        {msg.role === 'annie' && msg.intent && (
                          <div className="text-xs text-[#9a8a7a] mb-2 uppercase tracking-wider">
                            {msg.intent.replace('_', ' ')}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <div className={`text-xs mt-2 ${msg.role === 'customer' ? 'text-[#b8a888]' : 'text-[#9a8a7a]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#5a6a7a]">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
