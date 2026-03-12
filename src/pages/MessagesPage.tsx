import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../lib/store';
import { Conversation } from '../types';
import { ChevronLeft, Search, Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const MessagesPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'conversations'),
      where('memberIds', 'array-contains', profile.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation)));
    });

    return unsubscribe;
  }, [profile]);

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="p-4 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-gray-800"><ChevronLeft size={24} /></button>
        <h1 className="font-bold text-lg">Messages</h1>
        <button className="text-gray-800"><Search size={24} /></button>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-gray-300" />
          </div>
          <h3 className="font-bold text-lg mb-2">No messages yet</h3>
          <p className="text-gray-400 text-sm">Start a conversation with your friends to see them here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              onClick={() => navigate(`/messages/${conv.id}`)}
              className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden shrink-0">
                <img src={`https://picsum.photos/seed/${conv.id}/150/150`} alt="avatar" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm truncate">
                    {conv.memberIds.length === 2 ? 'Direct Chat' : 'Group Chat'}
                  </h3>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {formatDistanceToNow(conv.lastMessageAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate text-gray-400">
                  {conv.lastMessageText || 'No messages yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-24 right-6">
        <button className="w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};
