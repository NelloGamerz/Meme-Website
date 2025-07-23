export interface User{
  userId: string,
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
  userId: string,
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
  userId: string;
  tags?: string[];
  liked?: boolean;
  saved?: boolean;
}

export interface Comment {
  id?: string;
  memeId: string;
  userId: string;
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
  userId: string;
  tags?: string[];
}

export interface ApiComment {
  id?: string;
  userId: string;
  memeId: string;
  text: string;
  username: string;
  createdAt: string;
}

export interface ApiLike {
  memeId: string;
  userId: string;
}

export interface ApiSave {
  memeId: string;
  userId: string;
}


export interface ApiFollowers{
  userId?: string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface ApiFollowing{
  userId?: string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface Followers{
  userId?: string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface Following{
  userId?: string;
  username: string;
  profilePictureUrl: string;
  isFollow: boolean;
}

export interface ApiNotifications{
  id: string,
  userId: string;
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
  userId: string;
  senderUsername?: string;
  profilePictureUrl?: string;
  type: string;
  message: string;
  createdAt: Date;
  read?: boolean;
  isRead: boolean;
  memeId?: string;
  targetId?: string;
  sourceUserId?: string;
  sourceUsername?: string;
  sourceProfilePictureUrl?: string;
}

export interface ApiSearchResult{
  memes: ApiMeme[] | null,
  users: UserApi[] | null,
}