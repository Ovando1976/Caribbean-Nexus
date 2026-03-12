import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../lib/store';
import { AppNotification } from '../types';
import { ChevronLeft, Heart, MessageSquare, UserPlus, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
    });

    return unsubscribe;
  }, [profile]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare size={16} className="text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus size={16} className="text-green-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="p-4 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-gray-800"><ChevronLeft size={24} /></button>
        <h1 className="font-bold text-lg">Notifications</h1>
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Bell size={32} className="text-gray-300" />
          </div>
          <h3 className="font-bold text-lg mb-2">No notifications yet</h3>
          <p className="text-gray-400 text-sm">When people interact with your content, you'll see it here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {notifications.map(notif => (
            <div key={notif.id} className={`p-4 flex items-center gap-4 ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${notif.actorId}/100/100`} alt="actor" referrerPolicy="no-referrer" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                  {getIcon(notif.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-bold">Someone</span> {notif.type === 'like' ? 'liked your post' : notif.type === 'comment' ? 'commented on your post' : 'started following you'}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                  {formatDistanceToNow(notif.createdAt)} ago
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
