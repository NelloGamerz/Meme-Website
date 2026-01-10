import React from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, User } from "lucide-react";
import { CommentInput } from "./comment-input";
import type { Comment } from "../../types/mems";

interface MobileCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  commentCount: number;
  comment: string;
  setComment: (value: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onProfileClick: (username: string) => void;
  isLoadingMoreComments: boolean;
  hasMoreComments: boolean;
  commentsEndRef: React.RefObject<HTMLDivElement | null>;
  wsClient: WebSocket | null;
  isAuthenticated: boolean;
}

export function MobileCommentModal({
  isOpen,
  onClose,
  comments,
  commentCount,
  comment,
  setComment,
  onSubmitComment,
  onProfileClick,
  isLoadingMoreComments,
  hasMoreComments,
  commentsEndRef,
  wsClient,
  isAuthenticated,
}: MobileCommentModalProps) {
  if (!isOpen) return null;

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end backdrop-blur-sm bg-white/10 dark:bg-black/20">
      <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-t-3xl max-h-[80vh] flex flex-col border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-slate-800 text-black dark:text-white">
              Comments ({commentCount})
            </h3>
            {isAuthenticated && !wsClient && (
              <span className="text-xs text-orange-500">(Offline)</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-200 group"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-all duration-200" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom--scrollbar">
          {!isAuthenticated ? (
            <div className="text-center py-12 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Please log in to see comments
              </p>
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="text-center py-12 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No comments yet
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment) => (
                <div
                  key={`${comment.id}-${comment.createdAt}`}
                  className="flex items-start space-x-3 p-4 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <button onClick={() => onProfileClick(comment.username)}>
                    {comment.profilePictureUrl ? (
                      <img
                        src={comment.profilePictureUrl || "/placeholder.svg"}
                        alt={comment.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-600 shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-600 shadow-md">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => onProfileClick(comment.username)}
                        className="font-semibold text-slate-800 text-black dark:text-white hover:text-indigo-600 transition-colors duration-200"
                      >
                        {comment.username}
                      </button>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
              <div
                ref={isOpen ? commentsEndRef : null}
                className="py-6 text-center min-h-[60px] flex flex-col items-center justify-center"
              >
                {isLoadingMoreComments && (
                  <div className="flex justify-center items-center py-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-gray-700 border-t-indigo-600"></div>
                      <div className="absolute inset-0 rounded-full h-8 w-8 border-4 border-transparent border-t-purple-400 animate-spin animation-delay-150"></div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm ml-3 font-medium">
                      Loading more comments...
                    </p>
                  </div>
                )}
                {!hasMoreComments && !isLoadingMoreComments && comments.length > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                    No more comments to load
                  </p>
                )}
                {hasMoreComments && !isLoadingMoreComments && (
                  <div className="h-8 w-full bg-transparent flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-white/10 backdrop-blur-sm">
          <CommentInput
            value={comment}
            onChange={setComment}
            onSubmit={onSubmitComment}
            className="gap-4"
          />
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}
