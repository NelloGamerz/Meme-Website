import type React from "react";
import { MessageCircle } from "lucide-react";
import { CommentItem } from "./comment-item";
import { CommentInput } from "./comment-input";
import type { Comment } from "../../types/mems";

interface CommentsSectionProps {
  comments: Comment[];
  commentCount: number;
  comment: string;
  setComment: (value: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onProfileClick: (username: string) => void;
  onOpenModal: () => void;
  isLoadingMoreComments: boolean;
  hasMoreComments: boolean;
  commentsEndRef: React.RefObject<HTMLDivElement | null>;
  isCommentModalOpen: boolean;
  wsClient: WebSocket | null;
  isAuthenticated: boolean;
}

export function CommentsSection({
  comments,
  comment,
  setComment,
  onSubmitComment,
  onProfileClick,
  onOpenModal,
  isLoadingMoreComments,
  hasMoreComments,
  commentsEndRef,
  isCommentModalOpen,
  wsClient,
  isAuthenticated,
}: CommentsSectionProps) {
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <>
      <div className="flex lg:hidden items-center justify-between px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-semibold text-black dark:text-white">
            Comments
          </h3>
          {isAuthenticated && !wsClient && (
            <span className="text-xs text-orange-500">(Offline)</span>
          )}
        </div>
        <button
          onClick={onOpenModal}
          className="text-slate-600 hover:text-indigo-600 transition-colors duration-200 p-2 rounded-xl hover:bg-white/40 backdrop-blur-sm"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden lg:flex flex-col flex-1 min-h-0 border border-gray-300 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-slate-800 text-black dark:text-white">
              Comments
            </h3>
            {isAuthenticated && !wsClient && (
              <span className="text-xs text-orange-500">(Offline)</span>
            )}
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto mb-4 custom-scrollbar"
          style={{ maxHeight: "calc(100vh - 550px)" }}
        >
          {!isAuthenticated ? (
            <div className="text-center py-8 backdrop-blur-sm rounded-xl">
              <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">
                Please log in to see comments
              </p>
            </div>
          ) : sortedComments.length > 0 ? (
            <div className="space-y-3">
              {sortedComments.map((comment, index) => (
                <div key={`${comment.id}-${comment.createdAt}`}>
                  <CommentItem
                    comment={comment}
                    onProfileClick={onProfileClick}
                  />
                  {index !== sortedComments.length - 1 && (
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                  )}
                </div>
              ))}
              {hasMoreComments && (
                <div
                  ref={!isCommentModalOpen ? commentsEndRef : null}
                  className="py-4 text-center min-h-[40px] flex flex-col items-center justify-center"
                >
                  {isLoadingMoreComments ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-600" />
                      <p className="text-slate-600 text-sm ml-3 font-medium">
                        Loading more comments...
                      </p>
                    </div>
                  ) : (
                    <div className="h-4 w-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              )}

              {!hasMoreComments && (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">
                    No more comments to load
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 backdrop-blur-sm rounded-xl">
              <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">
                No comments yet. Be the first!
              </p>
            </div>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-white/20 dark:border-white/10">
          <CommentInput
            value={comment}
            onChange={setComment}
            onSubmit={onSubmitComment}
          />
        </div>
      </div>
    </>
  );
}
