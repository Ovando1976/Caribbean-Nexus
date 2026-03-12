import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../types';
import { postsService } from '../services';
import { useAuthStore } from '../lib/store';

export const PostCard = ({ post }: { post: Post, key?: string }) => {
  const { profile } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (!profile) return;
    try {
      await postsService.toggleLike(post.id, profile.id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-100 mb-4"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src={`https://picsum.photos/seed/${post.authorId}/100/100`} alt="avatar" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">User</h3>
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(post.createdAt)} ago
            </p>
          </div>
        </div>
        <button className="text-gray-400"><MoreHorizontal size={20} /></button>
      </div>

      <div className="aspect-square bg-gray-50 overflow-hidden">
        <img 
          src={post.mediaUrl || `https://picsum.photos/seed/${post.id}/800/800`} 
          alt="post content" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={handleLike}
            className={`transition-colors ${isLiked ? 'text-red-500' : 'text-gray-800'}`}
          >
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button className="text-gray-800 hover:text-blue-500 transition-colors">
            <MessageSquare size={24} />
          </button>
          <button className="text-gray-800 hover:text-green-500 transition-colors">
            <Share2 size={24} />
          </button>
        </div>
        
        <p className="text-sm font-bold mb-1">{post.likesCount || 0} likes</p>
        <p className="text-sm">
          <span className="font-bold mr-2">User</span>
          {post.caption}
        </p>
      </div>
    </motion.div>
  );
};
