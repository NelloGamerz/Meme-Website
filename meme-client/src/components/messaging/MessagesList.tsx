"use client";

import {
  useRef,
  useEffect,
  useState,
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TypingIndicator } from "./TypingIndicator";
import { MessageItem as OriginalMessageItem } from "./MessageItem";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import type { Message } from "../../types/mems";
import { useChatStore } from "../../store/useChatStore";

interface MessagesListProps {
  messages: Message[];
  chatRoomId: string;
  currentUser: string;
  typingUsers: Record<string, string[]>;
  isLoadingMessages?: boolean;
}

// Memoized MessageItem to prevent unnecessary re-renders
const MessageItem = memo(OriginalMessageItem);

export type MessagesListHandle = { scrollToBottom: () => void };

export const MessagesList = forwardRef<MessagesListHandle, MessagesListProps>(
  (
    { messages, chatRoomId, currentUser, typingUsers, isLoadingMessages },
    ref
  ) => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    // sentinel used for infinite scroll (kept as-is)
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // latestRef points to the DOM node of the newest (latest) message
    const latestRef = useRef<HTMLDivElement | null>(null);

    const isLoadingOlderRef = useRef(false);

    const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
    const [newMessageIds, setNewMessageIds] = useState<Set<string>>(
      new Set()
    );
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    // Always reset scroll to the bottom when switching chats
    useEffect(() => {
      if (!containerRef.current) return;
      // With flex-col-reverse, top (scrollTop = 0) shows the latest messages
      containerRef.current.scrollTop = 0;
    }, [chatRoomId]);

    const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
    const pagination = useChatStore((s) => s.messagePagination[chatRoomId]);

    // Reset loading state once backend finishes
    // useEffect(() => {
    //   if (!isLoadingOlderRef.current) return;
    //   if (pagination?.isLoadingMore === false) {
    //     isLoadingOlderRef.current = false;
    //   }
    // }, [pagination?.isLoadingMore]);

    // Detect new messages for animation only
    useEffect(() => {
      if (messages.length > prevMessageCount) {
        const newIds = new Set<string>();
        for (let i = prevMessageCount; i < messages.length; i++) {
          newIds.add(messages[i].id);
        }
        setNewMessageIds(newIds);

        const timer = setTimeout(() => setNewMessageIds(new Set()), 500);
        setPrevMessageCount(messages.length);

        return () => clearTimeout(timer);
      } else if (messages.length !== prevMessageCount) {
        setPrevMessageCount(messages.length);
      }
    }, [messages.length, prevMessageCount]);

    // NOTE: removed scrollTop-based handler because it's brittle with flex-col-reverse
    // and different browser behaviors. Instead we observe the "latest" message element.

    // Show/hide "scroll to bottom" button by observing the latest message's visibility
    useEffect(() => {
      const container = containerRef.current;
      const latest = latestRef.current;

      // If container isn't ready, nothing to observe.
      if (!container) return;

      // If latest element isn't mounted yet, perform a quick overflow check:
      if (!latest) {
        const isOverflowing = container.scrollHeight > container.clientHeight;
        // If there's content to scroll and we're not scrolled to latest, show button.
        // We'll assume user is at latest on fresh load (so hide), but show if overflow
        // and we can't detect latest element yet.
        setShowScrollToBottom(false && isOverflowing); // keep hidden until we have the latest node
      }

      // Create IntersectionObserver to watch latest message within the scroll container.
      let observer: IntersectionObserver | null = null;

      const createObserver = (target: Element) => {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            // when latest is intersecting => user is at latest => hide button
            // when latest is NOT intersecting => user scrolled away => show button
            setShowScrollToBottom(!entry.isIntersecting);
          },
          {
            root: container,
            // threshold chosen so 'mostly visible' counts as being at latest.
            threshold: 0.7,
          }
        );
        observer.observe(target);
      };

      if (latest) {
        createObserver(latest);
        // run an initial visibility check (in case observer fires slowly)
        const containerRect = container.getBoundingClientRect();
        const latestRect = latest.getBoundingClientRect();
        const isVisible =
          latestRect.top >= containerRect.top &&
          latestRect.bottom <= containerRect.bottom;
        setShowScrollToBottom(!isVisible);
      }

      return () => {
        if (observer) observer.disconnect();
      };
      // re-run when message count changes (new/older messages can move the "latest" node)
    }, [messages.length]);

    const scrollToBottom = () => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: 0, behavior: "smooth" }); // flex-col-reverse: top is latest
    };

    // expose imperative method to parent (e.g., to scroll after sending)
    useImperativeHandle(ref, () => ({ scrollToBottom }));

    // IntersectionObserver for infinite scroll (kept your original logic)
    useEffect(() => {
      if (!sentinelRef.current || !containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            !pagination?.isLoadingMore &&
            pagination?.hasMore !== false &&
            !isLoadingOlderRef.current
          ) {
            isLoadingOlderRef.current = true;
            loadOlderMessages(chatRoomId, pagination?.pageSize || 20).finally(
              () => {
                isLoadingOlderRef.current = false;
              }
            );
          }
        },
        { root: containerRef.current, threshold: 1.0 }
      );

      observer.observe(sentinelRef.current);

      return () => observer.disconnect();
    }, [messages, pagination, chatRoomId, loadOlderMessages]);

    // Precompute message metadata
    const messageData = useMemo(() => {
      const thresholdMs = 5 * 60 * 1000;
      return messages.map((message, index) => {
        const prev = index > 0 ? messages[index - 1] : undefined;
        const next =
          index < messages.length - 1 ? messages[index + 1] : undefined;

        const isSameGroupAsPrev =
          prev &&
          prev.senderUsername === message.senderUsername &&
          Math.abs(
            new Date(message.timestamp).getTime() -
              new Date(prev.timestamp).getTime()
          ) < thresholdMs;

        const isSameGroupAsNext =
          next &&
          next.senderUsername === message.senderUsername &&
          Math.abs(
            new Date(next.timestamp).getTime() -
              new Date(message.timestamp).getTime()
          ) < thresholdMs;

        return {
          message,
          isOwnMessage:
            message.isOwn ?? message.senderUsername === currentUser,
          showAvatar: !isSameGroupAsPrev,
          showHeader: !isSameGroupAsPrev,
          showFooterTime: !isSameGroupAsNext,
          isFirstInGroup: !isSameGroupAsPrev,
          isLastInGroup: !isSameGroupAsNext,
          isMiddleInGroup: isSameGroupAsPrev && isSameGroupAsNext,
          isNewMessage: newMessageIds.has(message.id),
        };
      });
    }, [messages, currentUser, newMessageIds]);

    if (isLoadingMessages) {
      return (
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900">
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} animate-pulse`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-end space-x-3 max-w-xs">
                  {i % 2 === 0 && (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  )}
                  <div
                    className={`p-4 rounded-2xl ${
                      i % 2 === 0
                        ? "bg-gray-200 dark:bg-gray-700 rounded-bl-md"
                        : "bg-blue-200 dark:bg-blue-800 rounded-br-md"
                    } shadow-sm`}
                  >
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-24"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-900 p-4 sm:p-8">
          <div className="transform transition-all duration-300 hover:scale-105">
            <MessageCircle className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-6 mx-auto animate-bounce" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              No messages yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Start a conversation by sending your first message!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900 custom-scrollbar flex flex-col-reverse"
      >
        {/* Scroll-to-bottom floating button */}
        <div className="space-y-1">
          {/* Loader at top */}
          <div className="flex justify-center py-4">
            <ScrollToBottomButton
              visible={showScrollToBottom}
              onClick={scrollToBottom}
            />
            {pagination?.isLoadingMore && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                <span className="text-sm">Loading messages...</span>
              </div>
            )}
          </div>

          {messageData.map((m, index) => {
            // Treat the first 5 items (0–4) as sentinel candidates
            const isSentinel = index <= 5;
            const isLatest = index === messages.length - 1;

            // callback ref attaches sentinelRef and latestRef as needed
            const attachRefs = (el: HTMLDivElement | null) => {
              if (isSentinel) sentinelRef.current = el;
              if (isLatest) latestRef.current = el;
            };

            return (
              <div
                key={m.message.id}
                ref={attachRefs}
                className={`${
                  m.isNewMessage
                    ? "animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
                    : ""
                }`}
              >
                <MessageItem
                  {...m}
                  onProfileClick={() =>
                    navigate(`/profile/${m.message.senderUsername}`)
                  }
                />
              </div>
            );
          })}

          {/* Typing indicator */}
          {chatRoomId && typingUsers[chatRoomId]?.length > 0 && (
            <div className="animate-in slide-in-from-left-5 fade-in duration-300">
              <TypingIndicator />
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    );
  }
);
