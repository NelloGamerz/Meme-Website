// // "use client";

// // import React, {
// //   useRef,
// //   useEffect,
// //   useState,
// //   useMemo,
// //   memo,
// //   forwardRef,
// //   useImperativeHandle,
// // } from "react";
// // import { MessageCircle } from "lucide-react";
// // import { useNavigate } from "react-router-dom";
// // import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
// // import { TypingIndicator } from "./TypingIndicator";
// // import { MessageItem as OriginalMessageItem } from "./MessageItem";
// // import { ScrollToBottomButton } from "./ScrollToBottomButton";
// // import type { Message } from "../../types/mems";
// // import { useChatStore } from "../../store/useChatStore";

// // interface MessagesListProps {
// //   messages: Message[];
// //   chatRoomId: string;
// //   currentUser: string;
// //   typingUsers: Record<string, string[]>;
// //   isLoadingMessages?: boolean;
// // }

// // // Memoized MessageItem to prevent unnecessary re-renders
// // const MessageItem = memo(OriginalMessageItem);

// // // Constant for virtuoso first item index (allows prepending messages)
// // const FIRST_ITEM_INDEX = 10000;

// // export type MessagesListHandle = { scrollToBottom: () => void };

// // export const MessagesList = forwardRef<MessagesListHandle, MessagesListProps>(
// //   (
// //     { messages, chatRoomId, currentUser, typingUsers, isLoadingMessages },
// //     ref
// //   ) => {
// //     const navigate = useNavigate();
// //     const virtuosoRef = useRef<VirtuosoHandle>(null);

// //     const isLoadingOlderRef = useRef(false);
// //     const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
// //     const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
// //     const [atBottom, setAtBottom] = useState(true);

// //     const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
// //     const pagination = useChatStore((s) => s.messagePagination[chatRoomId]);

// //     // Show scroll-to-bottom button when not at bottom
// //     const showScrollToBottom = !atBottom && messages.length > 0;

// //     // Always scroll to the bottom when switching chats
// //     useEffect(() => {
// //       if (virtuosoRef.current && messages.length > 0) {
// //         // Use scrollToIndex with the actual index in the virtuoso list
// //         virtuosoRef.current.scrollToIndex({
// //           index: FIRST_ITEM_INDEX - 1,
// //           align: "end",
// //           behavior: "auto",
// //         });
// //       }
// //     }, [chatRoomId]);

// //     // Detect new messages for animation only
// //     useEffect(() => {
// //       if (messages.length > prevMessageCount) {
// //         const newIds = new Set<string>();
// //         for (let i = prevMessageCount; i < messages.length; i++) {
// //           newIds.add(messages[i].id);
// //         }
// //         setNewMessageIds(newIds);

// //         const timer = setTimeout(() => setNewMessageIds(new Set()), 500);
// //         setPrevMessageCount(messages.length);

// //         return () => clearTimeout(timer);
// //       } else if (messages.length !== prevMessageCount) {
// //         setPrevMessageCount(messages.length);
// //       }
// //     }, [messages.length, prevMessageCount]);

// //     const scrollToBottom = () => {
// //       if (virtuosoRef.current && messages.length > 0) {
// //         virtuosoRef.current.scrollToIndex({
// //           index: FIRST_ITEM_INDEX - 1,
// //           align: "end",
// //           behavior: "smooth",
// //         });
// //       }
// //     };

// //     // expose imperative method to parent (e.g., to scroll after sending)
// //     useImperativeHandle(ref, () => ({ scrollToBottom }));

// //     // Handle loading older messages when scrolling to top
// //     const startReached = React.useCallback(() => {
// //       console.log("startReached triggered", {
// //         isLoadingMore: pagination?.isLoadingMore,
// //         hasMore: pagination?.hasMore,
// //         isLoadingOlderRef: isLoadingOlderRef.current,
// //       });

// //       if (
// //         !pagination?.isLoadingMore &&
// //         pagination?.hasMore !== false &&
// //         !isLoadingOlderRef.current
// //       ) {
// //         console.log("Loading older messages...");
// //         isLoadingOlderRef.current = true;
// //         loadOlderMessages(chatRoomId, pagination?.pageSize || 20).finally(
// //           () => {
// //             isLoadingOlderRef.current = false;
// //           }
// //         );
// //       }
// //     }, [
// //       pagination?.isLoadingMore,
// //       pagination?.hasMore,
// //       chatRoomId,
// //       loadOlderMessages,
// //     ]);

// //     // Precompute message metadata
// //     const messageData = useMemo(() => {
// //       const thresholdMs = 5 * 60 * 1000;
// //       return messages.map((message, index) => {
// //         const prev = index > 0 ? messages[index - 1] : undefined;
// //         const next =
// //           index < messages.length - 1 ? messages[index + 1] : undefined;

// //         const isSameGroupAsPrev =
// //           prev &&
// //           prev.senderUsername === message.senderUsername &&
// //           Math.abs(
// //             new Date(message.timestamp).getTime() -
// //               new Date(prev.timestamp).getTime()
// //           ) < thresholdMs;

// //         const isSameGroupAsNext =
// //           next &&
// //           next.senderUsername === message.senderUsername &&
// //           Math.abs(
// //             new Date(next.timestamp).getTime() -
// //               new Date(message.timestamp).getTime()
// //           ) < thresholdMs;

// //         return {
// //           message,
// //           isOwnMessage: message.isOwn ?? message.senderUsername === currentUser,
// //           showAvatar: !isSameGroupAsPrev,
// //           showHeader: !isSameGroupAsPrev,
// //           showFooterTime: !isSameGroupAsNext,
// //           isFirstInGroup: !isSameGroupAsPrev,
// //           isLastInGroup: !isSameGroupAsNext,
// //           isMiddleInGroup: isSameGroupAsPrev && isSameGroupAsNext,
// //           isNewMessage: newMessageIds.has(message.id),
// //         };
// //       });
// //     }, [messages, currentUser, newMessageIds]);

// //     // Calculate first item index for proper chat behavior
// //     const firstItemIndex = useMemo(
// //       () => FIRST_ITEM_INDEX - messageData.length,
// //       [messageData.length]
// //     );

// //     if (isLoadingMessages) {
// //       return (
// //         <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900">
// //           <div className="space-y-6">
// //             {Array.from({ length: 8 }).map((_, i) => (
// //               <div
// //                 key={i}
// //                 className={`flex ${
// //                   i % 2 === 0 ? "justify-start" : "justify-end"
// //                 } animate-pulse`}
// //                 style={{ animationDelay: `${i * 100}ms` }}
// //               >
// //                 <div className="flex items-end space-x-3 max-w-xs">
// //                   {i % 2 === 0 && (
// //                     <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
// //                   )}
// //                   <div
// //                     className={`p-4 rounded-2xl ${
// //                       i % 2 === 0
// //                         ? "bg-gray-200 dark:bg-gray-700 rounded-bl-md"
// //                         : "bg-blue-200 dark:bg-blue-800 rounded-br-md"
// //                     } shadow-sm`}
// //                   >
// //                     <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-24"></div>
// //                     <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
// //                   </div>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       );
// //     }

// //     if (messages.length === 0) {
// //       return (
// //         <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-900 p-4 sm:p-8">
// //           <div className="transform transition-all duration-300 hover:scale-105">
// //             <MessageCircle className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-6 mx-auto animate-bounce" />
// //             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
// //               No messages yet
// //             </h3>
// //             <p className="text-gray-600 dark:text-gray-400 max-w-md">
// //               Start a conversation by sending your first message!
// //             </p>
// //           </div>
// //         </div>
// //       );
// //     }

// //     return (
// //       <div className="relative flex-1 bg-white dark:bg-gray-900">
// //         <ScrollToBottomButton
// //           visible={showScrollToBottom}
// //           onClick={scrollToBottom}
// //         />

// //         <Virtuoso
// //           ref={virtuosoRef}
// //           data={messageData}
// //           firstItemIndex={firstItemIndex}
// //           initialTopMostItemIndex={FIRST_ITEM_INDEX - 1}
// //           followOutput="smooth"
// //           alignToBottom
// //           className="custom-scrollbar"
// //           style={{ height: "100%" }}
// //           overscan={200}
// //           increaseViewportBy={{ top: 200, bottom: 200 }}
// //           startReached={startReached}
// //           atBottomStateChange={setAtBottom}
// //           atBottomThreshold={50}
// //           components={{
// //             Header: () =>
// //               pagination?.isLoadingMore ? (
// //                 <div className="flex justify-center py-4">
// //                   <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
// //                     <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
// //                     <span className="text-sm">Loading messages...</span>
// //                   </div>
// //                 </div>
// //               ) : (
// //                 <div className="h-2" />
// //               ),
// //             Footer: () =>
// //               chatRoomId && typingUsers[chatRoomId]?.length > 0 ? (
// //                 <div className="animate-in slide-in-from-left-5 fade-in duration-300 px-3 sm:px-6 pb-4">
// //                   <TypingIndicator />
// //                 </div>
// //               ) : (
// //                 <div className="h-4" />
// //               ),
// //           }}
// //           itemContent={(index, m) => (
// //             <div
// //               className={`px-3 sm:px-6 py-1 ${
// //                 m.isNewMessage
// //                   ? "animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
// //                   : ""
// //               }`}
// //             >
// //               <MessageItem
// //                 {...m}
// //                 onProfileClick={() =>
// //                   navigate(`/profile/${m.message.senderUsername}`)
// //                 }
// //               />
// //             </div>
// //           )}
// //         />
// //       </div>
// //     );
// //   }
// // );

// "use client";

// import React, {
//   useRef,
//   useEffect,
//   useState,
//   useMemo,
//   memo,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { MessageCircle } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { TypingIndicator } from "./TypingIndicator";
// import { MessageItem as OriginalMessageItem } from "./MessageItem";
// import { ScrollToBottomButton } from "./ScrollToBottomButton";
// import type { Message } from "../../types/mems";
// import { useChatStore } from "../../store/useChatStore";

// interface MessagesListProps {
//   messages: Message[];
//   chatRoomId: string;
//   currentUser: string;
//   typingUsers: Record<string, string[]>;
//   isLoadingMessages?: boolean;
// }

// const MessageItem = memo(OriginalMessageItem);

// export type MessagesListHandle = { scrollToBottom: () => void };

// export const MessagesList = forwardRef<MessagesListHandle, MessagesListProps>(
//   ({ messages, chatRoomId, currentUser, typingUsers, isLoadingMessages }, ref) => {
//     const navigate = useNavigate();
//     const containerRef = useRef<HTMLDivElement>(null);
//     const sentinelRef = useRef<HTMLDivElement | null>(null);
//     const latestRef = useRef<HTMLDivElement | null>(null);
//     const isLoadingOlderRef = useRef(false);

//     const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
//     const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
//     const [showScrollToBottom, setShowScrollToBottom] = useState(false);

//     const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
//     const pagination = useChatStore((s) => s.messagePagination[chatRoomId]);

//     // 👉 Always scroll to bottom when switching chats
//     useEffect(() => {
//       const el = containerRef.current;
//       if (!el) return;
//       el.scrollTop = el.scrollHeight;
//     }, [chatRoomId]);

//     // 👉 Detect new messages for animation
//     useEffect(() => {
//       if (messages.length > prevMessageCount) {
//         const newIds = new Set<string>();
//         for (let i = prevMessageCount; i < messages.length; i++) {
//           newIds.add(messages[i].id);
//         }
//         setNewMessageIds(newIds);

//         const timer = setTimeout(() => setNewMessageIds(new Set()), 500);
//         setPrevMessageCount(messages.length);

//         return () => clearTimeout(timer);
//       } else if (messages.length !== prevMessageCount) {
//         setPrevMessageCount(messages.length);
//       }
//     }, [messages.length, prevMessageCount]);

//     // 👉 Track whether user is at bottom
//     useEffect(() => {
//       const container = containerRef.current;
//       if (!container) return;

//       const onScroll = () => {
//         const threshold = 50; // px
//         const atBottom =
//           container.scrollHeight - container.scrollTop - container.clientHeight <
//           threshold;
//         setShowScrollToBottom(!atBottom);
//       };

//       container.addEventListener("scroll", onScroll);
//       return () => container.removeEventListener("scroll", onScroll);
//     }, []);

//     // 👉 Scroll to bottom util
//     const scrollToBottom = () => {
//       const el = containerRef.current;
//       if (!el) return;
//       el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
//     };

//     useImperativeHandle(ref, () => ({ scrollToBottom }));

//     // 👉 Infinite scroll upwards
//     useEffect(() => {
//       if (!sentinelRef.current || !containerRef.current) return;

//       const observer = new IntersectionObserver(
//         (entries) => {
//           if (
//             entries[0].isIntersecting &&
//             !pagination?.isLoadingMore &&
//             pagination?.hasMore !== false &&
//             !isLoadingOlderRef.current
//           ) {
//             isLoadingOlderRef.current = true;
//             const el = containerRef.current;
//             const prevHeight = el?.scrollHeight ?? 0;

//             loadOlderMessages(chatRoomId, pagination?.pageSize || 20).finally(
//               () => {
//                 requestAnimationFrame(() => {
//                   if (el) {
//                     const newHeight = el.scrollHeight;
//                     el.scrollTop = newHeight - prevHeight; // preserve scroll
//                   }
//                   isLoadingOlderRef.current = false;
//                 });
//               }
//             );
//           }
//         },
//         { root: containerRef.current, threshold: 1.0 }
//       );

//       observer.observe(sentinelRef.current);
//       return () => observer.disconnect();
//     }, [messages, pagination, chatRoomId, loadOlderMessages]);

//     // 👉 Precompute message metadata
//     const messageData = useMemo(() => {
//       const thresholdMs = 5 * 60 * 1000;
//       return messages.map((message, index) => {
//         const prev = index > 0 ? messages[index - 1] : undefined;
//         const next = index < messages.length - 1 ? messages[index + 1] : undefined;

//         const isSameGroupAsPrev =
//           prev &&
//           prev.senderUsername === message.senderUsername &&
//           Math.abs(
//             new Date(message.timestamp).getTime() -
//               new Date(prev.timestamp).getTime()
//           ) < thresholdMs;

//         const isSameGroupAsNext =
//           next &&
//           next.senderUsername === message.senderUsername &&
//           Math.abs(
//             new Date(next.timestamp).getTime() -
//               new Date(message.timestamp).getTime()
//           ) < thresholdMs;

//         return {
//           message,
//           isOwnMessage: message.isOwn ?? message.senderUsername === currentUser,
//           showAvatar: !isSameGroupAsPrev,
//           showHeader: !isSameGroupAsPrev,
//           showFooterTime: !isSameGroupAsNext,
//           isFirstInGroup: !isSameGroupAsPrev,
//           isLastInGroup: !isSameGroupAsNext,
//           isMiddleInGroup: isSameGroupAsPrev && isSameGroupAsNext,
//           isNewMessage: newMessageIds.has(message.id),
//         };
//       });
//     }, [messages, currentUser, newMessageIds]);

//     // 👉 Loading state
//     if (isLoadingMessages) {
//       return (
//         <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900">
//           <div className="space-y-6">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div
//                 key={i}
//                 className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} animate-pulse`}
//                 style={{ animationDelay: `${i * 100}ms` }}
//               >
//                 <div className="flex items-end space-x-3 max-w-xs">
//                   {i % 2 === 0 && (
//                     <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
//                   )}
//                   <div
//                     className={`p-4 rounded-2xl ${
//                       i % 2 === 0
//                         ? "bg-gray-200 dark:bg-gray-700 rounded-bl-md"
//                         : "bg-blue-200 dark:bg-blue-800 rounded-br-md"
//                     } shadow-sm`}
//                   >
//                     <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-24"></div>
//                     <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     }

//     // 👉 Empty state
//     if (messages.length === 0) {
//       return (
//         <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-900 p-4 sm:p-8">
//           <div className="transform transition-all duration-300 hover:scale-105">
//             <MessageCircle className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-6 mx-auto animate-bounce" />
//             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
//               No messages yet
//             </h3>
//             <p className="text-gray-600 dark:text-gray-400 max-w-md">
//               Start a conversation by sending your first message!
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div
//         ref={containerRef}
//         className="relative flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900 custom-scrollbar"
//       >
//         {/* Loader + scroll-to-bottom button */}
//         <div className="flex justify-center py-2">
//           <ScrollToBottomButton visible={showScrollToBottom} onClick={scrollToBottom} />
//           {pagination?.isLoadingMore && (
//             <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
//               <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
//               <span className="text-sm">Loading messages...</span>
//             </div>
//           )}
//         </div>

//         {/* Sentinel for infinite scroll */}
//         <div ref={sentinelRef} className="h-1" />

//         {/* Messages */}
//         {messageData.map((m, index) => {
//           const isLatest = index === messages.length - 1;
//           const attachRef = (el: HTMLDivElement | null) => {
//             if (isLatest) latestRef.current = el;
//           };

//           return (
//             <div
//               key={m.message.id}
//               ref={attachRef}
//               className={m.isNewMessage ? "animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out" : ""}
//             >
//               <MessageItem
//                 {...m}
//                 onProfileClick={() =>
//                   navigate(`/profile/${m.message.senderUsername}`)
//                 }
//               />
//             </div>
//           );
//         })}

//         {/* Typing indicator */}
//         {chatRoomId && typingUsers[chatRoomId]?.length > 0 && (
//           <div className="animate-in slide-in-from-left-5 fade-in duration-300">
//             <TypingIndicator />
//           </div>
//         )}

//         <div className="h-4" />
//       </div>
//     );
//   }
// );

// "use client";

// import React, {
//   useRef,
//   useEffect,
//   useState,
//   useMemo,
//   memo,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { MessageCircle } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { TypingIndicator } from "./TypingIndicator";
// import { MessageItem as OriginalMessageItem } from "./MessageItem";
// import { ScrollToBottomButton } from "./ScrollToBottomButton";
// import type { Message } from "../../types/mems";
// import { useChatStore } from "../../store/useChatStore";

// interface MessagesListProps {
//   messages: Message[];
//   chatRoomId: string;
//   currentUser: string;
//   typingUsers: Record<string, string[]>;
//   isLoadingMessages?: boolean;
// }

// // Memoized MessageItem to prevent unnecessary re-renders
// const MessageItem = memo(OriginalMessageItem);

// export type MessagesListHandle = { scrollToBottom: () => void };

// export const MessagesList = forwardRef<MessagesListHandle, MessagesListProps>(
//   (
//     { messages, chatRoomId, currentUser, typingUsers, isLoadingMessages },
//     ref
//   ) => {
//     const navigate = useNavigate();
//     const containerRef = useRef<HTMLDivElement>(null);
//     const prevScrollHeightRef = useRef(0);

//     // sentinel used for infinite scroll (kept as-is)
//     const sentinelRef = useRef<HTMLDivElement | null>(null);

//     // latestRef points to the DOM node of the newest (latest) message
//     const latestRef = useRef<HTMLDivElement | null>(null);

//     const isLoadingOlderRef = useRef(false);

//     const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
//     const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
//     const [showScrollToBottom, setShowScrollToBottom] = useState(false);

//     // Always reset scroll to the bottom when switching chats
//     useEffect(() => {
//       if (!containerRef.current) return;
//       // With flex-col-reverse, top (scrollTop = 0) shows the latest messages
//       containerRef.current.scrollTop = 0;
//     }, [chatRoomId]);

//     const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
//     const pagination = useChatStore((s) => s.messagePagination[chatRoomId]);

//     // IntersectionObserver for infinite scroll
//     useEffect(() => {
//       if (!sentinelRef.current || !containerRef.current) return;
//       const container = containerRef.current; // Get container reference

//       const observer = new IntersectionObserver(
//         (entries) => {
//           if (
//             entries[0].isIntersecting &&
//             !pagination?.isLoadingMore &&
//             pagination?.hasMore !== false &&
//             !isLoadingOlderRef.current
//           ) {
//             isLoadingOlderRef.current = true;

//             // --- FIX 1: Capture current scroll height before loading ---
//             prevScrollHeightRef.current = container.scrollHeight;

//             loadOlderMessages(chatRoomId, pagination?.pageSize || 20).finally(
//               () => {
//                 isLoadingOlderRef.current = false;
//               }
//             );
//           }
//         },
//         { root: containerRef.current, threshold: 1.0 }
//       );

//       observer.observe(sentinelRef.current);

//       return () => observer.disconnect();
//     }, [messages, pagination, chatRoomId, loadOlderMessages]); // `messages` is a problematic dependency, see note below

//     // Reset loading state once backend finishes
//     // useEffect(() => {
//     //   if (!isLoadingOlderRef.current) return;
//     //   if (pagination?.isLoadingMore === false) {
//     //     isLoadingOlderRef.current = false;
//     //   }
//     // }, [pagination?.isLoadingMore]);

//     // Detect new messages for animation only
//     useEffect(() => {
//       if (messages.length > prevMessageCount) {
//         const newIds = new Set<string>();
//         for (let i = prevMessageCount; i < messages.length; i++) {
//           newIds.add(messages[i].id);
//         }
//         setNewMessageIds(newIds);

//         const timer = setTimeout(() => setNewMessageIds(new Set()), 500);
//         setPrevMessageCount(messages.length);

//         return () => clearTimeout(timer);
//       } else if (messages.length !== prevMessageCount) {
//         setPrevMessageCount(messages.length);
//       }
//     }, [messages.length, prevMessageCount]);

//     // NOTE: removed scrollTop-based handler because it's brittle with flex-col-reverse
//     // and different browser behaviors. Instead we observe the "latest" message element.

//     // Show/hide "scroll to bottom" button by observing the latest message's visibility
//     useEffect(() => {
//       const container = containerRef.current;
//       const latest = latestRef.current;

//       // If container isn't ready, nothing to observe.
//       if (!container) return;

//       // If latest element isn't mounted yet, perform a quick overflow check:
//       if (!latest) {
//         const isOverflowing = container.scrollHeight > container.clientHeight;
//         // If there's content to scroll and we're not scrolled to latest, show button.
//         // We'll assume user is at latest on fresh load (so hide), but show if overflow
//         // and we can't detect latest element yet.
//         setShowScrollToBottom(false && isOverflowing); // keep hidden until we have the latest node
//       }

//       // Create IntersectionObserver to watch latest message within the scroll container.
//       let observer: IntersectionObserver | null = null;

//       const createObserver = (target: Element) => {
//         observer = new IntersectionObserver(
//           (entries) => {
//             const entry = entries[0];
//             // when latest is intersecting => user is at latest => hide button
//             // when latest is NOT intersecting => user scrolled away => show button
//             setShowScrollToBottom(!entry.isIntersecting);
//           },
//           {
//             root: container,
//             // threshold chosen so 'mostly visible' counts as being at latest.
//             threshold: 0.7,
//           }
//         );
//         observer.observe(target);
//       };

//       if (latest) {
//         createObserver(latest);
//         // run an initial visibility check (in case observer fires slowly)
//         const containerRect = container.getBoundingClientRect();
//         const latestRect = latest.getBoundingClientRect();
//         const isVisible =
//           latestRect.top >= containerRect.top &&
//           latestRect.bottom <= containerRect.bottom;
//         setShowScrollToBottom(!isVisible);
//       }

//       return () => {
//         if (observer) observer.disconnect();
//       };
//       // re-run when message count changes (new/older messages can move the "latest" node)
//     }, [messages.length]);

//     const scrollToBottom = () => {
//       const el = containerRef.current;
//       if (!el) return;
//       el.scrollTo({ top: 0, behavior: "smooth" }); // flex-col-reverse: top is latest
//     };

//     // expose imperative method to parent (e.g., to scroll after sending)
//     useImperativeHandle(ref, () => ({ scrollToBottom }));

//     // IntersectionObserver for infinite scroll (kept your original logic)
//     useEffect(() => {
//       if (!sentinelRef.current || !containerRef.current) return;

//       const observer = new IntersectionObserver(
//         (entries) => {
//           if (
//             entries[0].isIntersecting &&
//             !pagination?.isLoadingMore &&
//             pagination?.hasMore !== false &&
//             !isLoadingOlderRef.current
//           ) {
//             isLoadingOlderRef.current = true;
//             loadOlderMessages(chatRoomId, pagination?.pageSize || 20).finally(
//               () => {
//                 isLoadingOlderRef.current = false;
//               }
//             );
//           }
//         },
//         { root: containerRef.current, threshold: 1.0 }
//       );

//       observer.observe(sentinelRef.current);

//       return () => observer.disconnect();
//     }, [messages, pagination, chatRoomId, loadOlderMessages]);

//     // Precompute message metadata
//     const messageData = useMemo(() => {
//       const thresholdMs = 5 * 60 * 1000;
//       return messages.map((message, index) => {
//         const prev = index > 0 ? messages[index - 1] : undefined;
//         const next =
//           index < messages.length - 1 ? messages[index + 1] : undefined;

//         const isSameGroupAsPrev =
//           prev &&
//           prev.senderUsername === message.senderUsername &&
//           Math.abs(
//             new Date(message.timestamp).getTime() -
//               new Date(prev.timestamp).getTime()
//           ) < thresholdMs;

//         const isSameGroupAsNext =
//           next &&
//           next.senderUsername === message.senderUsername &&
//           Math.abs(
//             new Date(next.timestamp).getTime() -
//               new Date(message.timestamp).getTime()
//           ) < thresholdMs;

//         return {
//           message,
//           isOwnMessage: message.isOwn ?? message.senderUsername === currentUser,
//           showAvatar: !isSameGroupAsPrev,
//           showHeader: !isSameGroupAsPrev,
//           showFooterTime: !isSameGroupAsNext,
//           isFirstInGroup: !isSameGroupAsPrev,
//           isLastInGroup: !isSameGroupAsNext,
//           isMiddleInGroup: isSameGroupAsPrev && isSameGroupAsNext,
//           isNewMessage: newMessageIds.has(message.id),
//         };
//       });
//     }, [messages, currentUser, newMessageIds]);

//     if (isLoadingMessages) {
//       return (
//         <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900">
//           <div className="space-y-6">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div
//                 key={i}
//                 className={`flex ${
//                   i % 2 === 0 ? "justify-start" : "justify-end"
//                 } animate-pulse`}
//                 style={{ animationDelay: `${i * 100}ms` }}
//               >
//                 <div className="flex items-end space-x-3 max-w-xs">
//                   {i % 2 === 0 && (
//                     <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
//                   )}
//                   <div
//                     className={`p-4 rounded-2xl ${
//                       i % 2 === 0
//                         ? "bg-gray-200 dark:bg-gray-700 rounded-bl-md"
//                         : "bg-blue-200 dark:bg-blue-800 rounded-br-md"
//                     } shadow-sm`}
//                   >
//                     <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-24"></div>
//                     <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     }

//     if (messages.length === 0) {
//       return (
//         <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-900 p-4 sm:p-8">
//           <div className="transform transition-all duration-300 hover:scale-105">
//             <MessageCircle className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-6 mx-auto animate-bounce" />
//             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
//               No messages yet
//             </h3>
//             <p className="text-gray-600 dark:text-gray-400 max-w-md">
//               Start a conversation by sending your first message!
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div
//         ref={containerRef}
//         className="relative flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900 custom-scrollbar flex flex-col-reverse"
//       >
//         {/* Scroll-to-bottom floating button */}
//         <div className="space-y-1">
//           {/* Loader at top */}
//           <div className="flex justify-center py-4">
//             <ScrollToBottomButton
//               visible={showScrollToBottom}
//               onClick={scrollToBottom}
//             />
//             {pagination?.isLoadingMore && (
//               <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
//                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
//                 <span className="text-sm">Loading messages...</span>
//               </div>
//             )}
//           </div>

//           {messageData.map((m, index) => {
//             // Treat the first 5 items (0–4) as sentinel candidates
//             const isSentinel = index <= 5;
//             const isLatest = index === messages.length - 1;

//             // callback ref attaches sentinelRef and latestRef as needed
//             const attachRefs = (el: HTMLDivElement | null) => {
//               if (isSentinel) sentinelRef.current = el;
//               if (isLatest) latestRef.current = el;
//             };

//             return (
//               <div
//                 key={m.message.id}
//                 ref={attachRefs}
//                 className={`${
//                   m.isNewMessage
//                     ? "animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
//                     : ""
//                 }`}
//               >
//                 <MessageItem
//                   {...m}
//                   onProfileClick={() =>
//                     navigate(`/profile/${m.message.senderUsername}`)
//                   }
//                 />
//               </div>
//             );
//           })}

//           {/* Typing indicator */}
//           {chatRoomId && typingUsers[chatRoomId]?.length > 0 && (
//             <div className="animate-in slide-in-from-left-5 fade-in duration-300">
//               <TypingIndicator />
//             </div>
//           )}

//           <div className="h-4" />
//         </div>
//       </div>
//     );
//   }
// );



// "use client";

// import React, {
//     useRef,
//     useEffect,
//     useState,
//     useMemo,
//     memo,
//     forwardRef,
//     useImperativeHandle,
//     useLayoutEffect, // 🔥 IMPORTED useLayoutEffect
// } from "react";
// import { MessageCircle } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { TypingIndicator } from "./TypingIndicator";
// import { MessageItem as OriginalMessageItem } from "./MessageItem";
// import { ScrollToBottomButton } from "./ScrollToBottomButton";
// import type { Message } from "../../types/mems";
// import { useChatStore } from "../../store/useChatStore";

// interface MessagesListProps {
//     messages: Message[];
//     chatRoomId: string;
//     currentUser: string;
//     typingUsers: Record<string, string[]>;
//     isLoadingMessages?: boolean;
// }

// // Memoized MessageItem to prevent unnecessary re-renders
// const MessageItem = memo(OriginalMessageItem);

// export type MessagesListHandle = { scrollToBottom: () => void };

// export const MessagesList = forwardRef<MessagesListHandle, MessagesListProps>(
//     (
//         { messages, chatRoomId, currentUser, typingUsers, isLoadingMessages },
//         ref
//     ) => {
//         const navigate = useNavigate();
//         const containerRef = useRef<HTMLDivElement>(null);

//         // sentinel used for infinite scroll (kept as-is)
//         const sentinelRef = useRef<HTMLDivElement | null>(null);

//         // latestRef points to the DOM node of the newest (latest) message
//         const latestRef = useRef<HTMLDivElement | null>(null);

//         const isLoadingOlderRef = useRef(false);

//         // 🔥 Ref to store scroll height before loading more
//         const prevScrollHeightRef = useRef(0);

//         const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
//         const [newMessageIds, setNewMessageIds] = useState<Set<string>>(
//             new Set()
//         );
//         const [showScrollToBottom, setShowScrollToBottom] = useState(false);

//         const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
//         const pagination = useChatStore((s) => s.messagePagination[chatRoomId]);

//         // Always reset scroll to the bottom when switching chats
//         useEffect(() => {
//             if (!containerRef.current) return;
//             // With flex-col-reverse, top (scrollTop = 0) shows the latest messages
//             containerRef.current.scrollTop = 0;
//             // Also reset scroll state management for the new chat
//             prevScrollHeightRef.current = 0;
//         }, [chatRoomId]);

//         // Detect new messages for animation only
//         useEffect(() => {
//             if (messages.length > prevMessageCount) {
//                 const newIds = new Set<string>();
//                 for (let i = prevMessageCount; i < messages.length; i++) {
//                     newIds.add(messages[i].id);
//                 }
//                 setNewMessageIds(newIds);

//                 const timer = setTimeout(() => setNewMessageIds(new Set()), 500);
//                 setPrevMessageCount(messages.length);

//                 return () => clearTimeout(timer);
//             } else if (messages.length !== prevMessageCount) {
//                 setPrevMessageCount(messages.length);
//             }
//         }, [messages.length, prevMessageCount]);

//         // 🔥 FIX: Use useLayoutEffect for synchronous scroll restoration
//         useLayoutEffect(() => {
//             const container = containerRef.current;
//             if (!container) return;

//             // Check if older messages were loaded and we captured a previous scroll height
//             if (messages.length > prevMessageCount && prevScrollHeightRef.current > 0) {
//                 const newScrollHeight = container.scrollHeight;
//                 const previousScrollHeight = prevScrollHeightRef.current;

//                 const heightDifference = newScrollHeight - previousScrollHeight;

//                 if (heightDifference > 0) {
//                     // Adjust scrollTop by the height of the newly loaded messages
//                     // This happens before the paint, making the scroll appear fixed.
//                     container.scrollTop += heightDifference;
//                 }
                
//                 // IMPORTANT: Reset this ref once scroll has been adjusted
//                 prevScrollHeightRef.current = 0;
//             }
//         }, [messages.length, prevMessageCount]);


//         // Show/hide "scroll to bottom" button by observing the latest message's visibility
//         useEffect(() => {
//             const container = containerRef.current;
//             const latest = latestRef.current;

//             if (!container) return;

//             let observer: IntersectionObserver | null = null;

//             const createObserver = (target: Element) => {
//                 observer = new IntersectionObserver(
//                     (entries) => {
//                         const entry = entries[0];
//                         setShowScrollToBottom(!entry.isIntersecting);
//                     },
//                     {
//                         root: container,
//                         threshold: 0.7,
//                     }
//                 );
//                 observer.observe(target);
//             };

//             if (latest) {
//                 createObserver(latest);
//                 // run an initial visibility check
//                 const containerRect = container.getBoundingClientRect();
//                 const latestRect = latest.getBoundingClientRect();
//                 const isVisible =
//                     latestRect.top >= containerRect.top &&
//                     latestRect.bottom <= containerRect.bottom;
//                 setShowScrollToBottom(!isVisible);
//             } else {
//                 setShowScrollToBottom(false);
//             }

//             return () => {
//                 if (observer) observer.disconnect();
//             };
//         }, [messages.length]);

//         const scrollToBottom = () => {
//             const el = containerRef.current;
//             if (!el) return;
//             el.scrollTo({ top: 0, behavior: "smooth" }); // flex-col-reverse: top is latest
//         };

//         // expose imperative method to parent (e.g., to scroll after sending)
//         useImperativeHandle(ref, () => ({ scrollToBottom }));

//         // IntersectionObserver for infinite scroll (load older messages)
//         useEffect(() => {
//             if (!sentinelRef.current || !containerRef.current) return;

//             const container = containerRef.current;
//             const observer = new IntersectionObserver(
//                 (entries) => {
//                     if (
//                         entries[0].isIntersecting &&
//                         !pagination?.isLoadingMore &&
//                         pagination?.hasMore !== false &&
//                         !isLoadingOlderRef.current
//                     ) {
//                         isLoadingOlderRef.current = true;
                        
//                         // 🔥 Capture current scroll height BEFORE loading more
//                         prevScrollHeightRef.current = container.scrollHeight; 
                        
//                         loadOlderMessages(chatRoomId, pagination?.pageSize || 20).finally(
//                             () => {
//                                 isLoadingOlderRef.current = false;
//                             }
//                         );
//                     }
//                 },
//                 { root: containerRef.current, threshold: 1.0 }
//             );

//             observer.observe(sentinelRef.current);

//             return () => observer.disconnect();
//         }, [pagination, chatRoomId, loadOlderMessages]);

//         // Precompute message metadata
//         const messageData = useMemo(() => {
//             const thresholdMs = 5 * 60 * 1000;
//             return messages.map((message, index) => {
//                 const prev = index > 0 ? messages[index - 1] : undefined;
//                 const next =
//                     index < messages.length - 1 ? messages[index + 1] : undefined;

//                 const isSameGroupAsPrev =
//                     prev &&
//                     prev.senderUsername === message.senderUsername &&
//                     Math.abs(
//                         new Date(message.timestamp).getTime() -
//                             new Date(prev.timestamp).getTime()
//                     ) < thresholdMs;

//                 const isSameGroupAsNext =
//                     next &&
//                     next.senderUsername === message.senderUsername &&
//                     Math.abs(
//                         new Date(next.timestamp).getTime() -
//                             new Date(message.timestamp).getTime()
//                     ) < thresholdMs;

//                 return {
//                     message,
//                     isOwnMessage:
//                         message.isOwn ?? message.senderUsername === currentUser,
//                     showAvatar: !isSameGroupAsPrev,
//                     showHeader: !isSameGroupAsPrev,
//                     showFooterTime: !isSameGroupAsNext,
//                     isFirstInGroup: !isSameGroupAsPrev,
//                     isLastInGroup: !isSameGroupAsNext,
//                     isMiddleInGroup: isSameGroupAsPrev && isSameGroupAsNext,
//                     isNewMessage: newMessageIds.has(message.id),
//                 };
//             });
//         }, [messages, currentUser, newMessageIds]);

//         if (isLoadingMessages) {
//             // ... (loading state JSX unchanged) ...
//             return (
//                 <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900">
//                     <div className="space-y-6">
//                         {Array.from({ length: 8 }).map((_, i) => (
//                             <div
//                                 key={i}
//                                 className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} animate-pulse`}
//                                 style={{ animationDelay: `${i * 100}ms` }}
//                             >
//                                 <div className="flex items-end space-x-3 max-w-xs">
//                                     {i % 2 === 0 && (
//                                         <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
//                                     )}
//                                     <div
//                                         className={`p-4 rounded-2xl ${
//                                             i % 2 === 0
//                                                 ? "bg-gray-200 dark:bg-gray-700 rounded-bl-md"
//                                                 : "bg-blue-200 dark:bg-blue-800 rounded-br-md"
//                                         } shadow-sm`}
//                                     >
//                                         <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-24"></div>
//                                         <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             );
//         }

//         if (messages.length === 0) {
//             // ... (no messages state JSX unchanged) ...
//             return (
//                 <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-900 p-4 sm:p-8">
//                     <div className="transform transition-all duration-300 hover:scale-105">
//                         <MessageCircle className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-6 mx-auto animate-bounce" />
//                         <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
//                             No messages yet
//                         </h3>
//                         <p className="text-gray-600 dark:text-gray-400 max-w-md">
//                             Start a conversation by sending your first message!
//                         </p>
//                     </div>
//                 </div>
//             );
//         }

//         return (
//             <div
//                 ref={containerRef}
//                 className="relative flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-gray-900 custom-scrollbar flex flex-col-reverse"
//             >
//                 {/* Scroll-to-bottom floating button */}
//                 <div className="space-y-1">
//                     {/* Loader at top */}
//                     <div className="flex justify-center py-4">
//                         <ScrollToBottomButton
//                             visible={showScrollToBottom}
//                             onClick={scrollToBottom}
//                         />
//                         {pagination?.isLoadingMore && (
//                             <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
//                                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
//                                 <span className="text-sm">Loading messages...</span>
//                             </div>
//                         )}
//                     </div>

//                     {messageData.map((m, index) => {
//                         const isSentinel = index <= 5;
//                         const isLatest = index === messages.length - 1;

//                         const attachRefs = (el: HTMLDivElement | null) => {
//                             if (isSentinel) sentinelRef.current = el;
//                             if (isLatest) latestRef.current = el;
//                         };

//                         return (
//                             <div
//                                 key={m.message.id}
//                                 ref={attachRefs}
//                                 className={`${
//                                     m.isNewMessage
//                                         ? "animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
//                                         : ""
//                                 }`}
//                             >
//                                 <MessageItem
//                                     {...m}
//                                     onProfileClick={() =>
//                                         navigate(`/profile/${m.message.senderUsername}`)
//                                     }
//                                 />
//                             </div>
//                         );
//                     })}

//                     {/* Typing indicator */}
//                     {chatRoomId && typingUsers[chatRoomId]?.length > 0 && (
//                         <div className="animate-in slide-in-from-left-5 fade-in duration-300">
//                             <TypingIndicator />
//                         </div>
//                     )}

//                     <div className="h-4" />
//                 </div>
//             </div>
//         );
//     }
// );



"use client";

import React, {
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
