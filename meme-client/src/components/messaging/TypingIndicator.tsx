import type React from "react";
import { motion } from "framer-motion";

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex justify-start mb-2 sm:mb-4"
    >
      <div className="flex items-end space-x-2 sm:space-x-3">
        {/* Avatar placeholder with subtle pulse */}
        {/* <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 shadow-sm"></div>
        </motion.div> */}

        {/* Typing bubble */}
        <motion.div
          className="bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-2xl rounded-bl-md px-3 sm:px-5 py-2 sm:py-3 shadow-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-1">
            {/* Animated dots with stagger */}
            <motion.div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 dark:bg-gray-400 rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.2,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>

            {/* Typing text */}
            <motion.span
              className="text-xs text-gray-500 dark:text-gray-400 ml-2 hidden sm:inline"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
              }}
            >
              typing...
            </motion.span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
