import type { Meme, ApiMeme } from "../types/mems";

export const mapApiMemeToMeme = (
  apiMeme: ApiMeme, 
  includeComments: boolean = false,
  liked: boolean = false,
  saved: boolean = false
): Meme => ({
  id: apiMeme.id,
  url: apiMeme.mediaUrl,
  title: apiMeme.caption,
  uploadedBy: apiMeme.uploadedby,
  uploadDate: new Date(),
  comments: includeComments ? (apiMeme.comments || []) : [],
  likeCount: apiMeme.likecount,
  saveCount: apiMeme.saveCount,
  uploader: apiMeme.uploader,
  commentsCount: apiMeme.commentsCount,
  memeCreated: apiMeme.memeCreated,
  profilePictureUrl: apiMeme.profilePictureUrl,
  tags: apiMeme.tags,
  liked: liked,
  saved: saved,
});