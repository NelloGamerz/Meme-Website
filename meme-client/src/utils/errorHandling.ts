import toast from "react-hot-toast";

export const handle429Error = (retryAfter?: string | number, context?: string): void => {
  const retryAfterSeconds = typeof retryAfter === 'string' ? parseInt(retryAfter, 10) : retryAfter;
  
  let message = "Too many requests. Please try again later.";
  
  if (retryAfterSeconds && !isNaN(retryAfterSeconds)) {
    if (retryAfterSeconds < 60) {
      message = `Too many requests. Please try again in ${retryAfterSeconds} seconds.`;
    } else {
      const minutes = Math.ceil(retryAfterSeconds / 60);
      message = `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    }
  }
  
  if (context) {
    message = `${context}: ${message}`;
  }
  
  toast.error(message, {
    duration: Math.min(retryAfterSeconds ? retryAfterSeconds * 1000 : 5000, 10000),
    id: `rate-limit-error-${context?.toLowerCase() || 'general'}`,
  });
};

export const handleWebSocket429Error = (retryAfter?: string | number): void => {
  handle429Error(retryAfter, "WebSocket");
};

export const handleAPI429Error = (retryAfter?: string | number): void => {
  handle429Error(retryAfter, "API");
};

export const is429Error = (error: any): boolean => {
  return error?.response?.status === 429 || error?.status === 429;
};

export const getRetryAfterFromError = (error: any): string | null => {
  return error?.response?.headers?.['retry-after'] || 
         error?.headers?.['retry-after'] || 
         null;
};