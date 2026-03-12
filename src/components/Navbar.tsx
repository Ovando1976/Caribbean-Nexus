import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageCircle, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const tabs = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/discover', icon: Search, label: 'Discover' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/messages', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-black' : 'text-gray-400'
            }`}
          >
            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
