'use client';

import * as React from 'react';
import { Search, Download, MessageSquare, User, Mail, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession } from './page';

interface ChatLogsClientProps {
  initialSessions: ChatSession[];
}

export function ChatLogsClient({ initialSessions }: ChatLogsClientProps) {
  const [sessions] = React.useState<ChatSession[]>(initialSessions);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSession, setSelectedSession] = React.useState<ChatSession | null>(null);

  // Search filtering logic
  const filteredSessions = React.useMemo(() => {
    return sessions.filter((s) => {
      const query = searchQuery.toLowerCase();
      return (
        s.client_name.toLowerCase().includes(query) ||
        s.client_email.toLowerCase().includes(query) ||
        s.style_preference.toLowerCase().includes(query) ||
        s.property_type.toLowerCase().includes(query)
      );
    });
  }, [sessions, searchQuery]);

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['Date', 'Client Name', 'Email', 'Phone', 'Property Type', 'Space Size', 'Budget', 'Style', 'Timeline', 'Messages Count'];
    const rows = filteredSessions.map((s) => [
      new Date(s.created_at).toLocaleString(),
      s.client_name,
      s.client_email,
      s.client_phone,
      s.property_type,
      s.space_size,
      s.budget,
      s.style_preference,
      s.timeline,
      s.messages.length,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nailaa_ai_consultation_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-white font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C9A86A]/10 pb-6">
        <div>
          <h1 className="text-2xl font-serif font-light text-white tracking-wide">
            AI Consultation Assistant Logs
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Analyze, track, and export active visitor conversations logged by the AI intake widget.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredSessions.length === 0}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#C9A86A] text-[#111111] font-semibold text-xs tracking-wider uppercase rounded hover:bg-[#C9A86A]/95 disabled:opacity-50 transition-all cursor-pointer shadow-[0_4px_15px_rgba(201,168,106,0.15)]"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex items-center bg-[#1A1A1A] border border-gray-800 rounded-lg px-3.5 py-2.5 max-w-md">
        <Search className="h-4.5 w-4.5 text-gray-500 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, style, or type..."
          className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
      </div>

      {/* Grid List Table */}
      <div className="overflow-x-auto bg-[#1A1A1A] border border-gray-800 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-[#161616]">
              <th className="p-4">Date</th>
              <th className="p-4">Client</th>
              <th className="p-4">Property Info</th>
              <th className="p-4">Pref / Budget</th>
              <th className="p-4">Timeline</th>
              <th className="p-4 text-center">Messages</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-white/2.5 transition-colors">
                  <td className="p-4 text-xs text-gray-400 select-none">
                    {new Date(session.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{session.client_name}</span>
                      {session.client_email !== 'Unspecified' && (
                        <span className="text-xs text-gray-500">{session.client_email}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-300">{session.property_type}</span>
                      <span className="text-[10px] text-gray-500">{session.space_size}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#C9A86A]">{session.style_preference}</span>
                      <span className="text-[10px] text-gray-500">{session.budget}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-300">{session.timeline}</td>
                  <td className="p-4 text-center text-xs font-semibold text-[#8A7052]">
                    {session.messages.length}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="px-3 py-1.5 rounded bg-[#222222] border border-gray-800 hover:border-[#C9A86A]/45 hover:text-[#C9A86A] text-xs font-medium cursor-pointer transition-all"
                    >
                      View Chat
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 select-none">
                  No AI conversations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Chat Modal Drawer */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex justify-end select-none">
            {/* Modal backdrop glass */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSession(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg h-full bg-[#161616] border-l border-gray-800 shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-[#1A1A1A]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-[#C9A86A]/10 text-[#C9A86A]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-light text-white">Consultation Transcript</h3>
                    <span className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold">
                      Session ID: {selectedSession.session_id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content Details */}
              <div className="px-6 py-4 border-b border-gray-800 bg-[#1C1C1C] flex flex-wrap gap-4 text-xs select-text">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <User className="h-4 w-4 text-[#C9A86A]" />
                  <span className="font-medium text-white">{selectedSession.client_name}</span>
                </div>
                {selectedSession.client_email !== 'Unspecified' && (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Mail className="h-4 w-4 text-[#C9A86A]" />
                    <span>{selectedSession.client_email}</span>
                  </div>
                )}
                {selectedSession.client_phone !== 'Unspecified' && (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Phone className="h-4 w-4 text-[#C9A86A]" />
                    <span>{selectedSession.client_phone}</span>
                  </div>
                )}
              </div>

              {/* Chat bubbles container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 select-text scrollbar-thin">
                {selectedSession.messages.length > 0 ? (
                  selectedSession.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-gray-600 font-bold px-1 select-none">
                        {m.sender === 'user' ? 'Visitor' : 'AI Assistant'}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-[#C9A86A] text-[#111111] font-semibold rounded-tr-none'
                            : 'bg-[#222222] border border-gray-800 text-gray-200 rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-600 text-sm pt-12 select-none">
                    No conversation logs recorded in this session.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
