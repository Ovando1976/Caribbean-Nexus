import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsService } from '../services';
import { useAuthStore } from '../lib/store';
import { ChevronLeft, Image as ImageIcon, Video, Type, Send } from 'lucide-react';

export const CreatePostPage = () => {
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!profile || (!caption && mediaType === 'text')) return;
    
    setLoading(true);
    try {
      await postsService.createPost(profile.id, {
        caption,
        mediaType,
        // In a real app, we'd upload to storage here
        mediaUrl: mediaType !== 'text' ? `https://picsum.photos/seed/${Date.now()}/800/800` : undefined
      });
      navigate('/');
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="p-4 flex justify-between items-center border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-800"><ChevronLeft size={24} /></button>
        <h1 className="font-bold text-lg">New Post</h1>
        <button 
          onClick={handleCreate}
          disabled={loading || (!caption && mediaType === 'text')}
          className="text-blue-500 font-bold disabled:opacity-50"
        >
          {loading ? '...' : 'Post'}
        </button>
      </header>

      <div className="p-4">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setMediaType('text')}
            className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mediaType === 'text' ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
          >
            <Type size={24} />
            <span className="text-xs font-bold uppercase">Text</span>
          </button>
          <button 
            onClick={() => setMediaType('image')}
            className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mediaType === 'image' ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
          >
            <ImageIcon size={24} />
            <span className="text-xs font-bold uppercase">Image</span>
          </button>
          <button 
            onClick={() => setMediaType('video')}
            className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mediaType === 'video' ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
          >
            <Video size={24} />
            <span className="text-xs font-bold uppercase">Video</span>
          </button>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full h-40 p-4 bg-gray-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-black/5"
        />

        {mediaType !== 'text' && (
          <div className="mt-4 aspect-video bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-medium">Media upload placeholder</p>
          </div>
        )}
      </div>
    </div>
  );
};
