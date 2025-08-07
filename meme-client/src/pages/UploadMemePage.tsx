import React, { useState, useRef } from "react";
import {
  X,
  ImagePlus,
  Tag,
  Upload,
  ArrowLeft,
  ArrowRight,
  Sliders,
} from "lucide-react";
import {
  FilterSelector,
  type Filter,
} from "../components/UploadPage/FilterSelector";
import {
  CategorySelector,
  type MemeCategory,
} from "../components/UploadPage/CategorySelector";
import { useUserStore } from "../store/useUserStore";
import { useCacheStore, type CacheStore } from "../store/useCacheStore";
import api from "../hooks/api";
import type { AxiosProgressEvent } from "axios";
import toast from "react-hot-toast";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import type { Meme } from "../types/mems";

type MediaType = "image" | "video" | "gif" | null;

type UploadStep = "select" | "filter" | "details";

interface MemeTag {
  id: string;
  name: string;
}

export const UploadMemePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MemeCategory | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<MemeTag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterProcessResponse, setFilterProcessResponse] = useState<{
    uploadedUrl: string;
    publicUrl: string;
    tmepKey: string;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Background upload states
  const [backgroundUploadPromise, setBackgroundUploadPromise] = useState<Promise<boolean> | null>(null);
  const [backgroundUploadStatus, setBackgroundUploadStatus] = useState<'idle' | 'uploading' | 'completed' | 'failed'>('idle');

  const profilePictureUrl = useUserStore.use.loggedInUserProfilePictureUrl();

  const resetUpload = () => {
    setCurrentStep("select");
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setSelectedFilter(null);
    setSelectedCategory(null);
    setTitle("");
    setTags([]);
    setTagInput("");
    setUploadProgress(null);
    setFilterProcessResponse(null);
    setShowSuccessDialog(false);
    setBackgroundUploadPromise(null);
    setBackgroundUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateMeme = async (
    file: File
  ): Promise<{ valid: boolean; message: string }> => {
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, message: "File must be less than 10MB" };
    }

    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 200 || img.height < 200) {
            resolve({
              valid: false,
              message: "Image dimensions must be at least 200x200 pixels",
            });
          } else {
            resolve({ valid: true, message: "" });
          }
        };
        img.onerror = () => {
          resolve({ valid: false, message: "Invalid image file" });
        };
        img.src = URL.createObjectURL(file);
      });
    }

    if (file.type.startsWith("video/") || file.type === "image/gif") {
      return { valid: true, message: "" };
    }

    return {
      valid: false,
      message:
        "Unsupported file format. Please upload an image, video, or GIF.",
    };
  };

  async function applyFilterToImage(
    file: File,
    cssFilter: string
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d")!;
        ctx.filter = cssFilter || "none";
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    });
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateMeme(file);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      if (file.type.startsWith("image/")) {
        if (file.type === "image/gif") {
          setMediaType("gif");
        } else {
          setMediaType("image");
        }
      } else if (file.type.startsWith("video/")) {
        setMediaType("video");
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      if (file.type.startsWith("image/") && file.type !== "image/gif") {
        setCurrentStep("filter");
      } else {
        const success = await processVideoOrGifUpload(file);
        if (success) {
          setCurrentStep("details");
        }
      }
    } catch (error) {
      toast.error("Error validating file. Please try again.");
    }
  };

  const processVideoOrGifUpload = async (file: File): Promise<boolean> => {
    try {
      const formattedFilename = file.name
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");
      const payload = {
        files: [
          {
            filename: formattedFilename,
            contentType: file.type,
            type: "meme",
          },
        ],
      };

      const response = await api.post("/upload/presign-temp", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (
        Array.isArray(response.data) &&
        response.data.length > 0 &&
        response.data[0].uploadedUrl &&
        response.data[0].publicUrl &&
        response.data[0].tmepKey
      ) {
        const uploadResponse = {
          uploadedUrl: response.data[0].uploadedUrl,
          publicUrl: response.data[0].publicUrl,
          tmepKey: response.data[0].tmepKey,
        };
        const uploadRes = await fetch(uploadResponse.uploadedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload to S3.");
        }
        setFilterProcessResponse(uploadResponse);
        return true;
      } else {
        toast.error("Failed to process upload. Please try again.");
        return false;
      }
    } catch (error) {
      toast.error("Failed to upload. Please try again.");
      return false;
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Helper function to calculate total character count of all tags
  const getTotalTagsCharacterCount = (currentTags: MemeTag[], newTagNames: string[] = []) => {
    const existingTagsLength = currentTags.reduce((total, tag) => total + tag.name.length, 0);
    const newTagsLength = newTagNames.reduce((total, tagName) => total + tagName.length, 0);
    return existingTagsLength + newTagsLength;
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const inputTags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    // Check if adding these tags would exceed the 250 character limit
    const totalCharacters = getTotalTagsCharacterCount(tags, inputTags);
    if (totalCharacters > 250) {
      toast.error("Tags cannot exceed 250 characters in total");
      return;
    }

    const newTags = inputTags.map((tagName) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: tagName,
    }));

    setTags([...tags, ...newTags]);
    setTagInput("");
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const startBackgroundUpload = async (): Promise<boolean> => {
    if (!selectedFile) {
      return false;
    }

    try {
      setBackgroundUploadStatus('uploading');
      
      let fileToUpload: File | Blob = selectedFile;

      if (mediaType === "image") {
        fileToUpload = await applyFilterToImage(
          selectedFile,
          selectedFilter?.cssFilter || "none"
        );
        fileToUpload = await compressImage(fileToUpload, 1024 * 1024);
      }

      const payload = {
        files: [
          {
            filename: selectedFile.name
              .trim()
              .replace(/\s+/g, "_")
              .replace(/[^\w.-]/g, ""),
            contentType: selectedFile.type,
            type: "meme",
          },
        ],
      };

      const response = await api.post("/upload/presign-temp", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (
        Array.isArray(response.data) &&
        response.data.length > 0 &&
        response.data[0].uploadedUrl &&
        response.data[0].publicUrl &&
        response.data[0].tmepKey
      ) {
        const filterResponse = {
          uploadedUrl: response.data[0].uploadedUrl,
          publicUrl: response.data[0].publicUrl,
          tmepKey: response.data[0].tmepKey,
        };

        const uploadRes = await fetch(filterResponse.uploadedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": selectedFile.type,
          },
          body: fileToUpload,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload to S3.");
        }
        
        setFilterProcessResponse(filterResponse);
        setBackgroundUploadStatus('completed');
        return true;
      } else {
        setBackgroundUploadStatus('failed');
        return false;
      }
    } catch (error) {
      setBackgroundUploadStatus('failed');
      return false;
    }
  };

  const compressImage = (file: Blob, maxSizeInBytes: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxWidth = 1024;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.9;

        const compressLoop = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject("Compression failed");

              if (blob.size <= maxSizeInBytes || quality <= 0.3) {
                resolve(blob);
              } else {
                quality -= 0.1;
                compressLoop();
              }
            },
            "image/jpeg",
            quality
          );
        };

        compressLoop();
      };

      img.onerror = reject;
      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || !selectedCategory || tags.length === 0) {
      toast.error("Please provide a file, title, category, and at least one tag");
      return;
    }

    try {
      const tagStrings = [
        ...new Set(
          tags.map((tag) => tag.name.trim()).filter((tag) => tag !== "")
        ),
      ];

      // Wait for background upload to complete if it's still running
      if (backgroundUploadPromise && backgroundUploadStatus === 'uploading') {
        setUploadProgress(0);
        toast.loading("Waiting for media upload to complete...", { id: 'background-upload' });
        
        const backgroundSuccess = await backgroundUploadPromise;
        toast.dismiss('background-upload');
        
        if (!backgroundSuccess) {
          toast.error("Media upload failed. Please try again.");
          setCurrentStep("filter");
          return;
        }
      }

      // Check if background upload failed
      if (backgroundUploadStatus === 'failed') {
        toast.error("Media upload failed. Please go back to the filter step and try again.");
        setCurrentStep("filter");
        return;
      }

      if (filterProcessResponse) {
        setUploadProgress(0);
        const memeUploadData = {
          profilePictureUrl: profilePictureUrl,
          tempKey: filterProcessResponse.tmepKey,
          title: title,
          category: selectedCategory.id,
          tags: tagStrings,
        };

        const uploadResponse = await api.post("/upload/meme", memeUploadData, {
          headers: {
            "Content-Type": "application/json",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        });

        // Update caches with the newly uploaded meme if the response contains meme data
        if (uploadResponse.data && uploadResponse.data.meme) {
          const newMeme: Meme = uploadResponse.data.meme;          
          // Update cache stores
          const cacheStore = useCacheStore.getState() as CacheStore;
          
          // Add to main page cache if valid
          cacheStore.addMemeToMainPageCache(newMeme);
          
          // Add to explore page cache if valid
          cacheStore.addMemeToExplorePageCache(newMeme);
        }

        setTimeout(() => {
          toast.success("Meme uploaded successfully!");
          setShowSuccessDialog(true);
        }, 500);
      } else {
        if (mediaType === "image") {
          toast.error(
            "Image processing data is missing. Please go back to the filter step and try again."
          );
          setCurrentStep("filter");
        } else {
          const success = await processVideoOrGifUpload(selectedFile);
          if (success) {
            handleUpload();
          }
        }
      }
    } catch (error) {
      toast.error("Failed to upload meme. Please try again.");
      setUploadProgress(null);
    }
  };

  const goToNextStep = async () => {
    if (currentStep === "select" && previewUrl) {
      if (mediaType === "image" && selectedFile?.type !== "image/gif") {
        setCurrentStep("filter");
      } else {
        setCurrentStep("details");
      }
    } else if (currentStep === "filter") {
      // Start background upload and move to next step immediately
      const uploadPromise = startBackgroundUpload();
      setBackgroundUploadPromise(uploadPromise);
      setCurrentStep("details");
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === "details") {
      if (mediaType === "image" && selectedFile?.type !== "image/gif") {
        setCurrentStep("filter");
      } else {
        setCurrentStep("select");
      }
    } else if (currentStep === "filter") {
      setCurrentStep("select");
    }
  };

  const renderStepIndicator = () => {
    const allSteps =
      mediaType === "image"
        ? ["select", "filter", "details"]
        : ["select", "details"];
    const stepNames = {
      select: "Select Media",
      filter: "Apply Filter",
      details: "Add Details",
    };
    const currentStepIndex = allSteps.indexOf(currentStep);
    const visibleSteps = allSteps.slice(0, currentStepIndex + 1);

    return (
      <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max px-2 sm:px-4">
          {visibleSteps.map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-full text-[10px] xs:text-xs sm:text-sm font-medium transition-colors ${
                  currentStep === step
                    ? "bg-blue-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {allSteps.indexOf(step) + 1}
              </div>
              <span
                className={`mx-1 xs:mx-2 sm:mx-2 text-[10px] xs:text-xs sm:text-sm font-medium whitespace-nowrap ${
                  currentStep === step
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="hidden xs:inline">
                  {stepNames[step as keyof typeof stepNames]}
                </span>
                <span className="xs:hidden">
                  {step === "select"
                    ? "Select"
                    : step === "filter"
                    ? "Filter"
                    : "Details"}
                </span>
              </span>
              {index < visibleSteps.length - 1 && (
                <div className="w-2 xs:w-4 sm:w-8 h-0.5 mx-0.5 xs:mx-1 sm:mx-2 bg-green-500" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-2 xs:p-3 sm:p-4 md:p-6 upload-page">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-xl overflow-hidden upload-card">
          <div className="p-3 xs:p-4 sm:p-6 md:p-8">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-center sm:mb-2 text-blue-600 dark:text-blue-600">
              Upload Your Meme
            </h1>

            <p className="text-center text-gray-600 dark:text-gray-400  sm:mb-6 md:mb-8 text-xs xs:text-sm sm:text-base upload-description">
              Share your creativity with the world
            </p>

            {renderStepIndicator()}

            {currentStep === "select" && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="bg-white dark:from-gray-700 dark:to-gray-600 p-3 xs:p-4 sm:p-6 md:p-8 rounded-lg xs:rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-600">
                  {previewUrl ? (
                    <div className="relative">
                      {mediaType === "image" || mediaType === "gif" ? (
                        <div className="relative w-full h-40 xs:h-48 sm:h-64 md:h-80 rounded-lg xs:rounded-xl bg-gray-100 dark:bg-gray-600 overflow-hidden">
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : mediaType === "video" ? (
                        <div className="relative w-full h-40 xs:h-48 sm:h-64 md:h-80 rounded-lg xs:rounded-xl bg-gray-100 dark:bg-gray-600 overflow-hidden">
                          <video
                            src={previewUrl}
                            className="w-full h-full object-contain"
                            controls
                          />
                        </div>
                      ) : null}
                      <button
                        onClick={resetUpload}
                        className="absolute top-1 xs:top-2 sm:top-4 right-1 xs:right-2 sm:right-4 p-1 xs:p-1.5 sm:p-2 bg-red-500 !text-white rounded-full hover:bg-red-600 transition-colors shadow-lg touch-manipulation"
                      >
                        <X className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 md:p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 touch-manipulation"
                    >
                      <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <ImagePlus className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Choose your media
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-1 sm:mb-2 text-xs xs:text-sm sm:text-base">
                        Click to select an image, video, or GIF
                      </p>
                      <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                         Supported: JPG, PNG, GIF, MP4 • Image: max 1MB • Video: max 2MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {previewUrl && (
                  <div className="flex justify-end">
                    <button
                      onClick={goToNextStep}
                      className="bg-blue-600 !text-white px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center font-medium shadow-lg hover:shadow-xl text-xs xs:text-sm sm:text-base touch-manipulation"
                    >
                      {mediaType === "image" ? (
                        <>
                          <Sliders className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">
                            Apply Filters
                          </span>
                          <span className="xs:hidden">Filters</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden xs:inline">Next</span>
                          <span className="xs:hidden">Next</span>
                          <ArrowRight className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === "filter" && previewUrl && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <FilterSelector
                  previewUrl={previewUrl}
                  selectedFilter={selectedFilter}
                  onFilterSelect={setSelectedFilter}
                />

                {uploadProgress !== null && uploadProgress < 100 && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg xs:rounded-xl">
                    <div className="flex justify-between text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-2">
                      <span className="font-medium">Preparing filter...</span>
                      <span className="font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 sm:h-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <div className="flex flex-row xs:flex-row justify-center items-center pt-2 sm:pt-4">
                  <button
                    onClick={goToPreviousStep}
                    className="w-full xs:w-auto bg-white dark:bg-gray-600 text-black dark:text-gray-300 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center justify-center text-xs xs:text-sm sm:text-base touch-manipulation"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Back
                  </button>

                  <button
                    onClick={goToNextStep}
                    disabled={uploadProgress !== null && uploadProgress < 100}
                    className="w-full xs:w-auto bg-blue-600 !text-white px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium shadow-lg hover:shadow-xl text-xs xs:text-sm sm:text-base touch-manipulation"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === "details" && (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {previewUrl && (
                  <div className="relative w-full h-40 xs:h-48 sm:h-64 rounded-lg xs:rounded-xl bg-gray-100 dark:bg-gray-600 overflow-hidden">
                    {mediaType === "image" || mediaType === "gif" ? (
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Final preview"
                        className="w-full h-full object-contain transition-all duration-300"
                        style={{ filter: selectedFilter?.cssFilter || "none" }}
                      />
                    ) : (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-contain"
                        controls
                      />
                    )}
                  </div>
                )}

                <CategorySelector
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                />

                <div>
                  <label
                    htmlFor="title"
                    className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Meme Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    placeholder="Enter a catchy title for your meme"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tags"
                    className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Tags <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-row xs:flex-row gap-2">
                      <input
                        type="text"
                        id="tags"
                        placeholder="Type tags and press Enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg xs:rounded-l-lg xs:rounded-r-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm sm:text-base"
                      />
                      <button
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || getTotalTagsCharacterCount(tags, tagInput.split(",").map(tag => tag.trim()).filter(tag => tag !== "")) > 250}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-700 !text-white rounded-lg xs:rounded-l-none xs:rounded-r-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
                      >
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    <div className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
                      Press Enter to add tags • Separate multiple tags with commas • {getTotalTagsCharacterCount(tags)}/250 characters
                    </div>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center bg-blue-600 !text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                        >
                          #{tag.name}
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="ml-1 sm:ml-2 !text-white hover:text-gray-200 transition-colors touch-manipulation"
                          >
                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-row xs:flex-row justify-between items-center pt-2 sm:pt-4">
                  <button
                    onClick={goToPreviousStep}
                    className="w-full xs:w-auto bg-white dark:bg-gray-600 text-black dark:text-gray-300 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center justify-center text-xs xs:text-sm sm:text-base touch-manipulation"
                  >
                    <ArrowLeft className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    Back
                  </button>

                  <button
                    onClick={handleUpload}
                    disabled={
                      !selectedFile || !title.trim() || !selectedCategory || tags.length === 0
                    }
                    className="w-full xs:w-auto bg-blue-600 !text-white px-4 xs:px-6 sm:px-8 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium shadow-lg hover:shadow-xl text-xs xs:text-sm sm:text-base touch-manipulation"
                  >
                    <Upload className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Upload Meme</span>
                    <span className="xs:hidden">Upload</span>
                  </button>
                </div>

                {uploadProgress !== null && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg xs:rounded-xl">
                    <div className="flex justify-between text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-2">
                      <span className="font-medium">
                        Uploading your meme...
                      </span>
                      <span className="font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 sm:h-3">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-700 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false);
          resetUpload();
          navigate('/');
        }}
        onConfirm={() => {
          setShowSuccessDialog(false);
          resetUpload();
        }}
        title="Upload Successful!"
        message="Your meme has been uploaded successfully and is now live on the platform. Would you like to upload another meme?"
        confirmText="Upload Another"
        cancelText="Done"
        confirmButtonClass="bg-green-600 hover:bg-green-700 text-white"
      />
    </div>
  );
};

export default UploadMemePage;
