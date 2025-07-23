import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Check } from "lucide-react";
import { useModalControls } from "../../hooks/useModalControls";

type SourceModal = "profile" | "banner";

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImageBlob: Blob) => void;
  imageFile: File;
  aspectRatio?: number;
  title: string;
  sourceModal: SourceModal;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageState {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  imageFile,
  aspectRatio,
  title,
  sourceModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCircular = sourceModal === "profile";

  useModalControls(isOpen, onClose, { disableEscapeKey: true });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const lastMoveTime = useRef<number>(0);

  const [imageState, setImageState] = useState<ImageState>({
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [initialImageState, setInitialImageState] = useState<ImageState>({
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [cropData, setCropData] = useState<CropData>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });

  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(400);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey, true);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsDragging(false);
      dragOffset.current = { x: 0, y: 0 };
      setIsInitialized(false);
      setImageLoaded(false);
    }
  }, [isOpen]);

  const calculateCanvasDimensions = useCallback((imageAspectRatio: number) => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    if (mobile) {
      const availableWidth = window.innerWidth - 32;
      const availableHeight = window.innerHeight - 280;
      const maxHeight = Math.min(availableHeight, 320);
      const maxWidth = Math.min(availableWidth, 400);
      const minWidth = 200;
      const minHeight = 200;

      let width = maxHeight * imageAspectRatio;
      let height = maxHeight;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / imageAspectRatio;
      }

      width = Math.max(minWidth, Math.min(maxWidth, width));
      height = Math.max(minHeight, Math.min(maxHeight, height));

      setCanvasWidth(Math.round(width));
      setCanvasHeight(Math.round(height));
    } else {
      const fixedHeight = 400;
      const maxWidth = 600;
      const minWidth = 300;

      let width = fixedHeight * imageAspectRatio;

      width = Math.max(minWidth, Math.min(maxWidth, width));

      setCanvasWidth(Math.round(width));
      setCanvasHeight(fixedHeight);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (imageElement) {
        const imageAspectRatio = imageElement.width / imageElement.height;
        calculateCanvasDimensions(imageAspectRatio);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageElement, calculateCanvasDimensions]);

  useEffect(() => {
    if (isOpen && imageFile) {
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        const imgAspectRatio = img.width / img.height;
        calculateCanvasDimensions(imgAspectRatio);
        setImageLoaded(true);
      };
      img.src = URL.createObjectURL(imageFile);
    }
  }, [isOpen, imageFile, calculateCanvasDimensions]);

  useEffect(() => {
    if (
      imageLoaded &&
      imageElement &&
      canvasWidth &&
      canvasHeight &&
      !isInitialized
    ) {
      let cropWidth, cropHeight;

      if (isCircular) {
        const maxSize = Math.min(canvasWidth, canvasHeight) * 0.8;
        cropWidth = maxSize;
        cropHeight = maxSize;
      } else {
        const targetAspectRatio = aspectRatio || 16 / 9;
        const maxWidth = canvasWidth;
        const maxHeight = canvasHeight * 0.8;

        if (maxWidth / maxHeight > targetAspectRatio) {
          cropHeight = maxHeight;
          cropWidth = cropHeight * targetAspectRatio;
        } else {
          cropWidth = maxWidth;
          cropHeight = cropWidth / targetAspectRatio;
        }
      }

      setCropData({
        x: (canvasWidth - cropWidth) / 2,
        y: (canvasHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });

      const scaleX = canvasWidth / imageElement.width;
      const scaleY = canvasHeight / imageElement.height;
      const scale = Math.min(scaleX, scaleY);

      const initialState = {
        scale: scale,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      setImageState(initialState);
      setInitialImageState(initialState);
      setIsInitialized(true);
    }
  }, [
    imageLoaded,
    imageElement,
    canvasWidth,
    canvasHeight,
    isInitialized,
    isCircular,
    aspectRatio,
  ]);

  useEffect(() => {
    if (
      imageLoaded &&
      imageElement &&
      canvasWidth &&
      canvasHeight &&
      isInitialized
    ) {
      let cropWidth, cropHeight;

      if (isCircular) {
        const maxSize = Math.min(canvasWidth, canvasHeight) * 0.8;
        cropWidth = maxSize;
        cropHeight = maxSize;
      } else {
        const targetAspectRatio = aspectRatio || 16 / 9;
        const maxWidth = canvasWidth;
        const maxHeight = canvasHeight * 0.8;

        if (maxWidth / maxHeight > targetAspectRatio) {
          cropHeight = maxHeight;
          cropWidth = cropHeight * targetAspectRatio;
        } else {
          cropWidth = maxWidth;
          cropHeight = cropWidth / targetAspectRatio;
        }
      }

      setCropData({
        x: (canvasWidth - cropWidth) / 2,
        y: (canvasHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [
    canvasWidth,
    canvasHeight,
    isCircular,
    aspectRatio,
    imageLoaded,
    imageElement,
    isInitialized,
  ]);

  const drawCropOverlay = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save();

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.globalCompositeOperation = "destination-out";

      if (isCircular) {
        const centerX = cropData.x + cropData.width / 2;
        const centerY = cropData.y + cropData.height / 2;
        const radius = Math.min(cropData.width, cropData.height) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.rect(cropData.x, cropData.y, cropData.width, cropData.height);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;

      if (isCircular) {
        const centerX = cropData.x + cropData.width / 2;
        const centerY = cropData.y + cropData.height / 2;
        const radius = Math.min(cropData.width, cropData.height) / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeRect(cropData.x, cropData.y, cropData.width, cropData.height);
      }

      ctx.restore();
    },
    [cropData, canvasWidth, canvasHeight, isCircular]
  );

  const drawCanvasSmooth = useCallback(() => {
    if (!imageElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const totalOffsetX = imageState.offsetX + dragOffset.current.x;
    const totalOffsetY = imageState.offsetY + dragOffset.current.y;

    ctx.save();

    ctx.translate(centerX + totalOffsetX, centerY + totalOffsetY);

    ctx.rotate((imageState.rotation * Math.PI) / 180);

    ctx.scale(imageState.scale, imageState.scale);

    ctx.drawImage(
      imageElement,
      -imageElement.width / 2,
      -imageElement.height / 2
    );

    ctx.restore();

    drawCropOverlay(ctx);
  }, [imageElement, imageState, drawCropOverlay, canvasWidth, canvasHeight]);

  const drawCanvas = useCallback(() => {
    drawCanvasSmooth();
  }, [drawCanvasSmooth]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;

        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";

        ctx.scale(dpr, dpr);
      }
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  const getEventCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getTouchDistance = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) return 0;
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const animateDrag = useCallback(() => {
    drawCanvasSmooth();
  }, [drawCanvasSmooth]);

  useEffect(() => {
    if (isDragging) {
      const animate = () => {
        animateDrag();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, animateDrag]);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setImageState((prev) => ({
          ...prev,
          offsetX: prev.offsetX + dragOffset.current.x,
          offsetY: prev.offsetY + dragOffset.current.y,
        }));

        dragOffset.current = { x: 0, y: 0 };
        setIsDragging(false);
      }
      setLastPinchDistance(0);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  const handlePointerDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();

    if ("touches" in e && e.touches.length === 2) {
      setLastPinchDistance(getTouchDistance(e));
      return;
    }

    const { x, y } = getEventCoordinates(e);

    setIsDragging(true);
    setDragStart({ x, y });
    dragOffset.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();

    if (!isDragging) return;

    const now = Date.now();
    if (now - lastMoveTime.current < 16) return;
    lastMoveTime.current = now;

    if ("touches" in e && e.touches.length === 2) {
      const currentDistance = getTouchDistance(e);
      if (lastPinchDistance > 0) {
        const scale = currentDistance / lastPinchDistance;
        const delta = (scale - 1) * 0.5;
        handleZoom(delta);
      }
      setLastPinchDistance(currentDistance);
      return;
    }

    const { x, y } = getEventCoordinates(e);
    const deltaX = (x - dragStart.x) / imageState.scale;
    const deltaY = (y - dragStart.y) / imageState.scale;

    setDragStart({ x, y });

    setImageState((prev) => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY,
    }));
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setImageState((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dragOffset.current.x,
        offsetY: prev.offsetY + dragOffset.current.y,
      }));

      dragOffset.current = { x: 0, y: 0 };
    }

    setIsDragging(false);
    setLastPinchDistance(0);
  };

  const handleZoom = (delta: number) => {
    setImageState((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale + delta)),
    }));
  };

  const handleRotate = () => {
    setImageState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleReset = () => {
    setImageState(initialImageState);
  };

  const handleSave = () => {
    if (!imageElement || !canvasRef.current) return;

    if (
      isDragging &&
      (dragOffset.current.x !== 0 || dragOffset.current.y !== 0)
    ) {
      setImageState((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dragOffset.current.x,
        offsetY: prev.offsetY + dragOffset.current.y,
      }));
      dragOffset.current = { x: 0, y: 0 };
      setIsDragging(false);
    }

    const outputScale = 2;
    const outputWidth = cropData.width * outputScale;
    const outputHeight = cropData.height * outputScale;

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = outputWidth;
    finalCanvas.height = outputHeight;
    const finalCtx = finalCanvas.getContext("2d");

    if (!finalCtx) return;

    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = "high";

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasWidth * outputScale;
    tempCanvas.height = canvasHeight * outputScale;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    tempCtx.save();
    tempCtx.scale(outputScale, outputScale);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const totalOffsetX = imageState.offsetX + dragOffset.current.x;
    const totalOffsetY = imageState.offsetY + dragOffset.current.y;

    tempCtx.translate(centerX + totalOffsetX, centerY + totalOffsetY);

    tempCtx.rotate((imageState.rotation * Math.PI) / 180);

    tempCtx.scale(imageState.scale, imageState.scale);

    tempCtx.drawImage(
      imageElement,
      -imageElement.width / 2,
      -imageElement.height / 2
    );

    tempCtx.restore();

    if (isCircular) {
      finalCtx.save();

      const centerX = outputWidth / 2;
      const centerY = outputHeight / 2;
      const radius = Math.min(outputWidth, outputHeight) / 2;

      finalCtx.beginPath();
      finalCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      finalCtx.clip();

      finalCtx.drawImage(
        tempCanvas,
        cropData.x * outputScale,
        cropData.y * outputScale,
        cropData.width * outputScale,
        cropData.height * outputScale,
        0,
        0,
        outputWidth,
        outputHeight
      );

      finalCtx.restore();
    } else {
      finalCtx.drawImage(
        tempCanvas,
        cropData.x * outputScale,
        cropData.y * outputScale,
        cropData.width * outputScale,
        cropData.height * outputScale,
        0,
        0,
        outputWidth,
        outputHeight
      );
    }

    finalCanvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, "image/png");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex items-center justify-center p-1 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl p-3 sm:p-6 max-h-[98vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Canvas */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
              style={{
                touchAction: "none",
                userSelect: "none",
                willChange: isDragging ? "transform" : "auto",
              }}
            >
              <canvas
                ref={canvasRef}
                className={`touch-none transition-all duration-75 ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleZoom(-0.1)}
              className={`flex items-center gap-1 ${
                isMobile ? "px-3 py-3" : "px-2 sm:px-3 py-2"
              } bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm ${
                isMobile ? "min-w-[44px] min-h-[44px]" : ""
              }`}
            >
              <ZoomOut className="w-4 h-4" />
              {!isMobile && "Zoom Out"}
            </button>

            <button
              onClick={() => handleZoom(0.1)}
              className={`flex items-center gap-1 ${
                isMobile ? "px-3 py-3" : "px-2 sm:px-3 py-2"
              } bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm ${
                isMobile ? "min-w-[44px] min-h-[44px]" : ""
              }`}
            >
              <ZoomIn className="w-4 h-4" />
              {!isMobile && "Zoom In"}
            </button>

            <button
              onClick={handleRotate}
              className={`flex items-center gap-1 ${
                isMobile ? "px-3 py-3" : "px-2 sm:px-3 py-2"
              } bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm ${
                isMobile ? "min-w-[44px] min-h-[44px]" : ""
              }`}
            >
              <RotateCw className="w-4 h-4" />
              {!isMobile && "Rotate"}
            </button>

            <button
              onClick={handleReset}
              className={`flex items-center gap-1 ${
                isMobile ? "px-3 py-3" : "px-2 sm:px-3 py-2"
              } bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm ${
                isMobile ? "min-w-[44px] min-h-[44px]" : ""
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              {!isMobile && "Reset"}
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center space-y-1">
            {isMobile ? (
              <>
                <p>• Tap and drag to move the image within the crop area</p>
                <p>• Pinch to zoom in/out, use buttons to rotate</p>
                <p>• Touch area is optimized for easy editing</p>
              </>
            ) : (
              <>
                <p>• Click and drag to move the image within the crop area</p>
                <p>• Use buttons to zoom and rotate the image</p>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              onClick={onClose}
              className={`flex-1 ${
                isMobile ? "py-3" : "py-2"
              } px-3 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm sm:text-base ${
                isMobile ? "min-h-[44px]" : ""
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 bg-blue-600 text-white ${
                isMobile ? "py-3" : "py-2"
              } px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                isMobile ? "min-h-[44px]" : ""
              }`}
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
