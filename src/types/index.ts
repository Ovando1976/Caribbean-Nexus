export type PostType = "text" | "image" | "video";
export type Visibility = "public" | "followers";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  createdAt: number;
  updatedAt: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  caption: string;
  mediaType: PostType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  createdAt: number;
  updatedAt?: number;
  visibility: Visibility;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: number;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
  lastMessageText?: string;
  lastMessageAt?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "video" | "audio" | "shared_post";
  text?: string;
  mediaUrl?: string;
  sharedPostId?: string;
  createdAt: number;
  seenBy?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string;
  type: "like" | "comment" | "follow" | "message";
  entityId?: string;
  read: boolean;
  createdAt: number;
}
