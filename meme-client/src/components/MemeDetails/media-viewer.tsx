import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface MediaViewerProps {
  url: string;
  title: string;
  isVideo: boolean;
}

export function MediaViewer({ url, title, isVideo }: MediaViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.loop = true;

      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(true));
      }
    }
  }, [isPlaying, isVideo, url]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className="lg:col-span-2 relative flex items-center justify-center min-h-[50vh] lg:min-h-[85vh] 
      dark:from-gray-900 dark:to-gray-800
      bg-slate-100"
    >
      <div className="w-full h-full flex items-center justify-center p-4">
        {isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center group">
            <video
              ref={videoRef}
              src={url}
              className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/30"
              loop
              playsInline
              muted={isMuted}
            />

            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 dark:bg-black/20 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
              <button
                onClick={togglePlay}
                className="p-2 text-white hover:text-blue-300 transition-colors duration-200 rounded-full hover:bg-black/10 hover:dark:bg-white/40"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 text-white hover:text-blue-300 transition-colors duration-200 rounded-full hover:bg-black/10 hover:dark:bg-white/40"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <img
            src={url || "/placeholder.svg"}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/30"
          />
        )}
      </div>
    </div>
  );
}
