import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Smile, 
  Image, 
  Send,
  Paperclip
} from "lucide-react";
import EmojiPicker, { Theme, EmojiStyle, Categories } from "emoji-picker-react";

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  conversationId?: string;
  onTyping?: (conversationId: string) => void;
  onStopTyping?: (conversationId: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  conversationId,
  onTyping,
  onStopTyping
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle typing indicators
  const handleStartTyping = useCallback(() => {
    if (!conversationId || !onTyping) return;
    
    // Only set typing state and emit event if not already typing
    if (!isTyping) {
      setIsTyping(true);
      onTyping(conversationId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        if (onStopTyping && conversationId) {
          onStopTyping(conversationId);
        }
      }
    }, 3000);
  }, [conversationId, onTyping, onStopTyping, isTyping]);

  const handleStopTyping = useCallback(() => {
    if (!conversationId || !onStopTyping) return;
    
    // Only stop typing if currently typing
    if (isTyping) {
      setIsTyping(false);
      onStopTyping(conversationId);
    }
    
    // Always clear the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, onStopTyping, isTyping]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Use a ref to track if a message is currently being sent
  const isSendingRef = useRef(false);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent sending if the input is empty, disabled, or already sending
    if (!messageInput.trim() || disabled || isSending || isSendingRef.current) return;
    
    // Stop typing when sending message
    if (isTyping) {
      handleStopTyping();
    }
    
    const messageToSend = messageInput.trim();
    
    // Set sending state and ref
    setIsSending(true);
    isSendingRef.current = true;
    
    // Clear the input immediately to prevent multiple sends
    setMessageInput("");
    
    try {
      // Send the message and await the response to prevent multiple sends
      await onSendMessage(messageToSend);
      
      // Focus back to input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      // Reset sending states
      setIsSending(false);
      
      // Add a small delay before allowing another send to prevent rapid clicks
      setTimeout(() => {
        isSendingRef.current = false;
      }, 500);
    }
  };

  // Insert selected emoji at the cursor position and keep focus
  const handleEmojiSelect = (emoji: { native: string }) => {
    const symbol: string = emoji?.native || "";
    if (!symbol) return;

    const inputEl = inputRef.current;
    if (!inputEl) {
      setMessageInput(prev => prev + symbol);
      return;
    }

    const start = inputEl.selectionStart ?? messageInput.length;
    const end = inputEl.selectionEnd ?? messageInput.length;
    const nextValue = messageInput.slice(0, start) + symbol + messageInput.slice(end);
    setMessageInput(nextValue);

    // Close picker after selection
    setShowEmojiPicker(false);

    // Restore focus and caret position after inserting
    requestAnimationFrame(() => {
      inputEl.focus();
      const caret = start + symbol.length;
      inputEl.setSelectionRange(caret, caret);
    });
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!showEmojiPicker) return;
      if (
        pickerRef.current && !pickerRef.current.contains(target) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showEmojiPicker]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200 ${
      isFocused ? 'shadow-lg' : 'shadow-sm'
    }`}>
      <div className="p-3 sm:p-4 pb-4 ">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-3">
          {/* Attachment button - Hidden on small screens */}
          {/* <button
            type="button"
            className="hidden sm:flex p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0 touch-manipulation"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button> */}

          {/* Image button */}
          {/* <button
            type="button"
            className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0 touch-manipulation"
            title="Send image"
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </button> */}
          
          {/* Input container */}
          <div className="flex-1 relative">
            <div className={`relative rounded-2xl transition-all duration-200 ${
              isFocused 
                ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-md' 
                : 'shadow-sm'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setMessageInput(newValue);
                  
                  // Only trigger typing events when necessary
                  if (newValue.trim()) {
                    // Has content - start typing if not already typing
                    handleStartTyping();
                  } else if (isTyping) {
                    // No content - stop typing if currently typing
                    handleStopTyping();
                  }
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  if (isTyping) {
                    handleStopTyping();
                  }
                }}
                placeholder="Type a message..."
                className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl border-none focus:outline-none transition-all duration-200 pr-10 sm:pr-12 text-sm touch-manipulation ${
                  isFocused 
                    ? 'bg-white dark:bg-gray-700 shadow-inner' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
                disabled={disabled || isSending}
              />
              
              {/* Emoji button */}
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setShowEmojiPicker(v => !v)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110 touch-manipulation"
                title="Add emoji"
              >
                <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Emoji picker dropdown */}
              {showEmojiPicker && (
                <div
                  ref={pickerRef}
                  className="absolute right-0 bottom-12 sm:bottom-14 z-50 shadow-md border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => handleEmojiSelect({ native: emojiData.emoji })}
                    theme={document.documentElement.classList.contains('dark') ? ('dark' as Theme) : ('light' as Theme)}
                    searchDisabled
                    skinTonesDisabled
                    emojiStyle={EmojiStyle.NATIVE}
                    width={320}
                    height={360}
                    lazyLoadEmojis
                    previewConfig={{ showPreview: false }}
                    categories={[
                      {
                        category: Categories.SUGGESTED,
                        name: ""
                      },
                      {
                        category: Categories.SMILEYS_PEOPLE,
                        name: ""
                      },
                      {
                        category: Categories.ANIMALS_NATURE,
                        name: ""
                      },
                      {
                        category: Categories.FOOD_DRINK,
                        name: ""
                      },
                      {
                        category: Categories.TRAVEL_PLACES,
                        name: ""
                      },
                      {
                        category: Categories.ACTIVITIES,
                        name: ""
                      },
                      {
                        category: Categories.OBJECTS,
                        name: ""
                      },
                      {
                        category: Categories.SYMBOLS,
                        name: ""
                      },
                      {
                        category: Categories.FLAGS,
                        name: ""
                      }
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Character count indicator (optional, for long messages) */}
            {/* {messageInput.length > 100 && (
              <div className="absolute -top-5 sm:-top-6 right-0 text-xs text-gray-500 dark:text-gray-400">
                {messageInput.length}/1000
              </div>
            )} */}
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!messageInput.trim() || disabled || isSending}
            className={`p-3 sm:p-3.5 rounded-full transition-all duration-200 flex-shrink-0 touch-manipulation ${
              messageInput.trim() && !disabled && !isSending
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl scale-100 hover:scale-110' 
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed scale-95'
            }`}
            title="Send message"
          >
            <Send 
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                isSending ? 'animate-pulse' : ''
              }`} 
            />
          </button>
        </form>

        {/* Typing indicator space */}
        {/* <div className="mt-1 sm:mt-2 h-3 sm:h-4 flex items-center">
          {isSending && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              </div>
              <span className="hidden sm:inline">Sending...</span>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};