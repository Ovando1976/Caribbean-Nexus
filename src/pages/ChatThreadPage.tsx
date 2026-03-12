import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { messagesService, usersService } from '../services';
import { useAuthStore } from '../lib/store';
import { Message, UserProfile } from '../types';
import { ChevronLeft, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChatThreadPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !profile) return;

    // Fetch messages in real-time
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Fetch other user info
    const fetchOtherUser = async () => {
      const convDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (convDoc.exists()) {
        const memberIds = convDoc.data().memberIds as string[];
        const otherId = memberIds.find(id => id !== profile.id);
        if (otherId) {
          const user = await usersService.getProfile(otherId);
          setOtherUser(user);
        }
      }
    };

    fetchOtherUser();

    return unsubscribe;
  }, [conversationId, profile]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversationId || !profile) return;

    const msgText = text;
    setText('');
    try {
      await messagesService.sendMessage(conversationId, profile.id, msgText);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-gray-800"><ChevronLeft size={24} /></button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src={otherUser?.avatarUrl || `https://picsum.photos/seed/${otherUser?.id}/100/100`} alt="avatar" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{otherUser?.displayName || 'Loading...'}</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => {
          const isMe = msg.senderId === profile?.id;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                isMe 
                  ? 'bg-black text-white rounded-tr-none' 
                  : 'bg-gray-100 text-black rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-full px-4">
          <button type="button" className="text-gray-400"><ImageIcon size={20} /></button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button type="button" className="text-gray-400"><Smile size={20} /></button>
          <button 
            type="submit" 
            disabled={!text.trim()}
            className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
