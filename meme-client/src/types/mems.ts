export interface User{
  username?: string,
  profilePictureUrl: string,
  memeList: Meme[]
  likedMeme: Meme[],
  savedMeme: Meme[],
  userCreated : Date,
  following: Following[],
  followers: Followers[],
  followersCount: number,
  followingCount: number,
}

export interface UserApi{
  username: string,
  profilePictureUrl: string,
  memeList: Meme[]
  likedMeme: Meme[],
  savedMeme: Meme[],
  userCreated : Date,
  following: Following[],
  followers: Followers[],
  followersCount: number,
  followingCount: number,
}

export interface Meme {
  id: string;
  url?: string;
  mediaUrl?: string;
  title: string;
  uploadedBy?: string;
  uploadDate?: Date;
  memeCreated?: Date;
  comments: Comment[];
  likeCount: number;
  saveCount: number;
  commentsCount: number;
  uploader: string;
  profilePictureUrl: string;
  tags?: string[];
  liked?: boolean;
  saved?: boolean;
}

export interface Comment {
  id?: string;
  memeId: string;
  text: string;
  username: string;
  createdAt: string;
  profilePictureUrl: string;
}

export interface ApiMeme {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  uploadedby: string;
  memeCreated?: Date;
  createdAt?: Date;
  comments?: Comment[];
  likecount: number;
  saveCount: number;
  commentsCount: number;
  uploader: string;
  profilePictureUrl: string;
  tags?: string[];
}

export interface ApiComment {
  id?: string;
  memeId: string;
  text: string;
  username: string;
  createdAt: string;
}

export interface ApiLike {
  memeId: string;
}

export interface ApiSave {
  memeId: string;
}


export interface ApiFollowers{
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface ApiFollowing{
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface Followers{
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface Following{
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface ApiNotifications{
  id: string,
  username: string;
  profilePictureUrl: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  isRead: boolean;
}

export interface Notification{
  id: string,
  senderUsername?: string;
  profilePictureUrl?: string;
  type: string;
  message: string;
  createdAt: Date;
  read?: boolean;
  isRead: boolean;
  memeId?: string;
  targetId?: string;
  sourceUsername?: string;
  sourceProfilePictureUrl?: string;
}

export interface ApiSearchResult{
  memes: ApiMeme[] | null,
  users: UserApi[] | null,
}

export interface Message {
  id: string;
  chatRoomId: string;
  message: string;
  messageType: 'text' | 'image' | 'meme' | 'video' | 'audio' | 'file';
  mediaUrl?: string;
  replyToMessageId?: string;
  senderId: string;
  senderUsername: string;
  senderProfilePicture: string;
  timestamp: Date;
  read: boolean;
  edited?: boolean;
  deleted?: boolean;
  isOwn?: boolean; // For WebSocket messages to determine left/right positioning
  isServerConfirmed?: boolean; // Flag to indicate if this message is confirmed by the server
}

export interface ChatRoom {
  chatRoomId: string;
  name: string;
  profilePictureUrl: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAt: Date;
}

export interface ConversationParticipant {
  username: string;
  profilePictureUrl: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ApiMessage {
  id: string;
  chatRoomId: string;
  message: string;
  messageType: 'text' | 'image' | 'meme' | 'video' | 'audio' | 'file';
  mediaUrl?: string;
  replyToMessageId?: string;
  senderId: string;
  senderUsername: string;
  senderProfilePicture: string;
  timestamp: string;
  read: boolean;
  edited?: boolean;
  deleted?: boolean;
}

export interface ApiChatRoom {
  chatRoomId: string;
  isGroup: boolean;
  username: string;
  profilePictureUrl: string;
  lastMessage?: string;
  lastUpdated: string;
  unreadCount: number;
}