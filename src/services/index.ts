import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Post, PostType } from "../types";

export const usersService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists()
      ? ({ id: userDoc.id, ...userDoc.data() } as UserProfile)
      : null;
  },

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const usernameDoc = await getDoc(doc(db, "usernames", username));
    if (!usernameDoc.exists()) return null;
    return this.getProfile(usernameDoc.data().userId);
  },

  async createProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<void> {
    const profile: UserProfile = {
      id: userId,
      email: data.email || "",
      username: data.username || "",
      displayName: data.displayName || "",
      bio: data.bio || "",
      avatarUrl:
        data.avatarUrl || `https://picsum.photos/seed/${userId}/200/200`,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
    };

    await runTransaction(db, async (transaction) => {
      transaction.set(doc(db, "users", userId), profile);
      transaction.set(doc(db, "usernames", profile.username), { userId });
    });
  },

  async updateProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<void> {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: Date.now(),
    });
  },
};

export const postsService = {
  async createPost(
    userId: string,
    data: { caption: string; mediaType: PostType; mediaUrl?: string }
  ): Promise<string> {
    const postRef = await addDoc(collection(db, "posts"), {
      authorId: userId,
      ...data,
      visibility: "public",
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: Date.now(),
    });

    await updateDoc(doc(db, "users", userId), {
      postsCount: increment(1),
    });

    return postRef.id;
  },

  async getFeed(limitCount = 20): Promise<Post[]> {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
  },

  async getPostsByUser(userId: string): Promise<Post[]> {
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
  },

  async toggleLike(postId: string, userId: string): Promise<void> {
    const likeRef = doc(db, "posts", postId, "likes", userId);
    const likeDoc = await getDoc(likeRef);

    await runTransaction(db, async (transaction) => {
      if (likeDoc.exists()) {
        transaction.delete(likeRef);
        transaction.update(doc(db, "posts", postId), {
          likesCount: increment(-1),
        });
      } else {
        transaction.set(likeRef, { createdAt: Date.now() });
        transaction.update(doc(db, "posts", postId), {
          likesCount: increment(1),
        });
      }
    });
  },

  async addComment(
    postId: string,
    userId: string,
    text: string
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const commentRef = doc(collection(db, "posts", postId, "comments"));
      transaction.set(commentRef, {
        postId,
        authorId: userId,
        text,
        createdAt: Date.now(),
      });
      transaction.update(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });
    });
  },
};

export const messagesService = {
  async getOrCreateConversation(
    currentUserId: string,
    targetUserId: string
  ): Promise<string> {
    const q = query(
      collection(db, "conversations"),
      where("type", "==", "direct"),
      where("memberIds", "array-contains", currentUserId)
    );

    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find((doc) =>
      doc.data().memberIds.includes(targetUserId)
    );

    if (existing) return existing.id;

    const convRef = await addDoc(collection(db, "conversations"), {
      type: "direct",
      memberIds: [currentUserId, targetUserId],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return convRef.id;
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const msgRef = doc(
        collection(db, "conversations", conversationId, "messages")
      );
      transaction.set(msgRef, {
        conversationId,
        senderId,
        type: "text",
        text,
        createdAt: Date.now(),
      });
      transaction.update(doc(db, "conversations", conversationId), {
        lastMessageText: text,
        lastMessageAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  },
};
