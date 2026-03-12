import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate
} from 'react-router-dom';
import { useAuthInit } from './hooks/useAuthInit';
import { useAuthStore } from './lib/store';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  MessageCircle, 
  LogOut,
  Bell,
  ChevronLeft
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Post } from './types';

// Components
import { Navbar } from './components/Navbar';
import { PostCard } from './components/PostCard';

// Pages
import { CreatePostPage } from './pages/CreatePostPage';
import { MessagesPage } from './pages/MessagesPage';
import { ChatThreadPage } from './pages/ChatThreadPage';
import { NotificationsPage } from './pages/NotificationsPage';

// --- Views ---

const FeedPage = () => {
  const [posts, setPosts] = React.useState<Post[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 z-40 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter italic">NEXUS</h1>
        <div className="flex gap-4">
          <Link to="/notifications"><Bell size={24} className="text-gray-800" /></Link>
          <Link to="/messages"><MessageCircle size={24} className="text-gray-800" /></Link>
        </div>
      </header>
      <div className="max-w-md mx-auto">
        {posts.length === 0 ? (
          <div className="p-20 text-center text-gray-400">No posts yet. Be the first to post!</div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="p-6 pb-24 max-w-md mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gray-100 overflow-hidden shadow-xl rotate-3">
          <img src={profile?.avatarUrl} alt="profile" referrerPolicy="no-referrer" />
        </div>
        <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={24} /></button>
      </div>
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight">{profile?.displayName}</h2>
        <p className="text-gray-500 font-medium">@{profile?.username}</p>
        <p className="mt-4 text-gray-700 leading-relaxed">{profile?.bio || "Welcome to my Nexus."}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <p className="text-xl font-bold">{profile?.postsCount || 0}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Posts</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <p className="text-xl font-bold">{profile?.followersCount || 0}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Followers</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <p className="text-xl font-bold">{profile?.followingCount || 0}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Following</p>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-black text-white">
      <h1 className="text-7xl font-black tracking-tighter italic mb-4">NEXUS</h1>
      <p className="text-gray-400 mb-12 text-center">The social operating system for creators.</p>
      <button onClick={handleLogin} className="w-full bg-white text-black font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-5 h-5" />
        Continue with Google
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  useAuthInit();
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-black">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/" element={user ? <FeedPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/create" element={user ? <CreatePostPage /> : <Navigate to="/login" />} />
          <Route path="/messages" element={user ? <MessagesPage /> : <Navigate to="/login" />} />
          <Route path="/messages/:conversationId" element={user ? <ChatThreadPage /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
              <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-400"><ChevronLeft size={20} /> Back</Link>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Coming Soon</h2>
              <p className="text-gray-400">This feature is being built for the Nexus Social OS.</p>
            </div>
          } />
        </Routes>
        {user && <Navbar />}
      </div>
    </Router>
  );
}
