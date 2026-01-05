// "use client";

// import React from "react";
// import { ArrowDown } from "lucide-react";

// interface ScrollToBottomButtonProps {
//   visible: boolean;
//   onClick: () => void;
// }

// // Floating button to jump to the latest message
// export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
//   visible,
//   onClick,
// }) => {
//   if (!visible) return null;

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       aria-label="Scroll to latest messages"
//       className="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors px-4 py-2"
//     >
//       <ArrowDown className="w-5 h-5" />
//       <span className="text-sm font-medium hidden sm:inline">Bottom</span>
//     </button>
//   );
// };

// "use client";

// import React from "react";
// import { ArrowDown } from "lucide-react";

// interface ScrollToBottomButtonProps {
//   visible: boolean;
//   onClick: () => void;
// }

// // WhatsApp-style floating scroll-to-bottom button
// export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
//   visible,
//   onClick,
// }) => {
//   if (!visible) return null;

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       aria-label="Scroll to latest messages"
//       className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
//     >
//       <ArrowDown className="w-6 h-6" />
//     </button>
//   );
// };



// "use client";

// import React from "react";
// import { ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ScrollToBottomButtonProps {
//   visible: boolean;
//   onClick: () => void;
// }

// // WhatsApp-style floating scroll-to-bottom button with animations
// export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
//   visible,
//   onClick,
// }) => {
//   return (
//     <AnimatePresence>
//       {visible && (
//         <motion.button
//           key="scroll-btn"
//           type="button"
//           onClick={onClick}
//           aria-label="Scroll to latest messages"
//           initial={{ opacity: 0, y: 40, scale: 0.8 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           exit={{ opacity: 0, y: 40, scale: 0.8 }}
//           transition={{ duration: 0.25, ease: "easeOut" }}
//           whileTap={{ scale: 0.9 }}
//           className="fixed bottom-24 left-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
//         >
//           <ArrowDown className="w-6 h-6" />
//         </motion.button>
//       )}
//     </AnimatePresence>
//   );
// };

"use client";

import React from "react";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

// WhatsApp-style floating scroll-to-bottom button with animations
export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onClick,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-btn"
          type="button"
          onClick={onClick}
          aria-label="Scroll to latest messages"
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-24 translate-x-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ArrowDown className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};




// "use client";

// import React from "react";
// import { ArrowDown } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";

// interface ScrollToBottomButtonProps {
//   visible: boolean;
//   onClick: () => void;
// }

// // WhatsApp-style floating scroll-to-bottom button centered in parent
// export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
//   visible,
//   onClick,
// }) => {
//   return (
//     <AnimatePresence>
//       {visible && (
//         <motion.button
//           key="scroll-btn"
//           type="button"
//           onClick={onClick}
//           aria-label="Scroll to latest messages"
//           initial={{ opacity: 0, y: 40, scale: 0.8 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           exit={{ opacity: 0, y: 40, scale: 0.8 }}
//           transition={{ duration: 0.25, ease: "easeOut" }}
//           whileTap={{ scale: 0.9 }}
//           className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
//         >
//           <ArrowDown className="w-6 h-6" />
//         </motion.button>
//       )}
//     </AnimatePresence>
//   );
// };
