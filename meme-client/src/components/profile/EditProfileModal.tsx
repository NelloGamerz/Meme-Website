import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X, CameraIcon, ImageIcon } from "lucide-react";
import { useModalControls } from "../../hooks/useModalControls";
import toast from "react-hot-toast";
import { useUserStore } from "../../store/useUserStore";
import { ImageEditorModal } from "./ImageEditorModal";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    username?: string;
    profilePicture?: File;
    profileBanner?: File;
  }) => Promise<void>;
  currentName: string;
  currentProfilePicture?: string;
  currentProfileBanner?: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentProfilePicture,
  currentProfileBanner,
}) => {
  const [editName, setEditName] = useState(currentName);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [profileBannerFile, setProfileBannerFile] = useState<File | null>(null);
  const [profileBannerPreview, setProfileBannerPreview] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfilePictureLoading, setIsProfilePictureLoading] = useState(
    !!currentProfilePicture
  );
  const [isBannerLoading, setIsBannerLoading] = useState(
    !!currentProfileBanner
  );

  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImageType, setEditingImageType] = useState<
    "profile" | "banner"
  >("profile");

  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const profileBannerInputRef = useRef<HTMLInputElement>(null);
  const profilePictureUrl = useUserStore.use.loggedInUserProfilePictureUrl();
  const profileBannerUrl = useUserStore.use.loggedInUserProfileBannerUrl();

  useModalControls(isOpen, onClose);

  const isValidImageUrl = (url?: string): boolean => {
    return !!url && url !== "" && url !== "undefined" && url !== "null";
  };

  useEffect(() => {
    if (isOpen) {
      setEditName(currentName);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      setProfileBannerFile(null);
      setProfileBannerPreview(null);

      const hasValidProfilePicture =
        isValidImageUrl(profilePictureUrl) ||
        isValidImageUrl(currentProfilePicture);
      const hasValidBanner =
        isValidImageUrl(profileBannerUrl) ||
        isValidImageUrl(currentProfileBanner);

      setIsProfilePictureLoading(hasValidProfilePicture);
      setIsBannerLoading(hasValidBanner);

      return () => {
        if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
        if (profileBannerPreview) URL.revokeObjectURL(profileBannerPreview);
      };
    }
  }, [
    isOpen,
    currentName,
    currentProfilePicture,
    currentProfileBanner,
    profilePictureUrl,
    profileBannerUrl,
  ]);

  const validateImage = (
    file: File,
    isProfilePicture: boolean
  ): { valid: boolean; message: string } => {
    const maxSize = isProfilePicture ? 1024 * 1024 : 2 * 1024 * 1024;
    const type = isProfilePicture ? "Profile picture" : "Banner image";

    if (file.size > maxSize) {
      return {
        valid: false,
        message: `${type} must be less than ${
          isProfilePicture ? "1MB" : "2MB"
        }`,
      };
    }

    if (!file.type.startsWith("image/")) {
      return { valid: false, message: "File must be an image" };
    }

    return { valid: true, message: "" };
  };

  const handleProfilePictureSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateImage(file, true);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      setEditingImageFile(file);
      setEditingImageType("profile");
      setImageEditorOpen(true);
    }
  };

  const handleProfileBannerSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateImage(file, false);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      setEditingImageFile(file);
      setEditingImageType("banner");
      setImageEditorOpen(true);
    }
  };

  const resetProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    }
  };

  const resetProfileBanner = () => {
    setProfileBannerFile(null);
    setProfileBannerPreview(null);
    if (profileBannerInputRef.current) {
      profileBannerInputRef.current.value = "";
    }
  };

  const handleImageEditorSave = (editedImageBlob: Blob) => {
    const editedFile = new File(
      [editedImageBlob],
      `edited_${editingImageType}.png`,
      {
        type: "image/png",
      }
    );

    if (editingImageType === "profile") {
      setProfilePictureFile(editedFile);
      setProfilePicturePreview(URL.createObjectURL(editedFile));
    } else {
      setProfileBannerFile(editedFile);
      setProfileBannerPreview(URL.createObjectURL(editedFile));
    }

    setImageEditorOpen(false);
    setEditingImageFile(null);
  };

  const handleImageEditorClose = () => {
    setImageEditorOpen(false);
    setEditingImageFile(null);

    if (editingImageType === "profile" && profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    } else if (editingImageType === "banner" && profileBannerInputRef.current) {
      profileBannerInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!editName.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const updateData: {
        username?: string;
        profilePicture?: File;
        profileBanner?: File;
      } = {};

      if (editName !== currentName) {
        updateData.username = editName;
      }

      if (profilePictureFile) {
        updateData.profilePicture = profilePictureFile;
      }

      if (profileBannerFile) {
        updateData.profileBanner = profileBannerFile;
      }

      if (Object.keys(updateData).length > 0) {
        await onSave(updateData);
        toast.success("Profile updated successfully!");
      } else {
        toast.success("No changes to save!");
      }

      onClose();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative w-full h-32 rounded-lg overflow-hidden group">

            {profileBannerPreview ||
            isValidImageUrl(profileBannerUrl) ||
            isValidImageUrl(currentProfileBanner) ? (
              <>
                {isBannerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={
                    profileBannerPreview ||
                    profileBannerUrl ||
                    currentProfileBanner
                  }
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onLoad={() => setIsBannerLoading(false)}
                  onError={(e) => {
                    setIsBannerLoading(false);
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.style.backgroundImage = `url("data:image/svg+xml;base64,${btoa(`
            <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
              <rect width='100%' height='100%' fill='#dbeafe'/>
              <circle cx='50%' cy='50%' r='80' fill='#3b82f6' opacity='0.15'/>
              <circle cx='30%' cy='30%' r='40' fill='#1e3a8a' opacity='0.1'/>
            </svg>
          `)}")`;
                      parent.style.backgroundSize = "cover";
                      parent.style.backgroundPosition = "center";
                    }
                  }}
                />
              </>
            ) : (
              <div
                className="absolute inset-0 w-full h-full bg-center bg-cover"
                style={{
                  backgroundImage: `url("data:image/svg+xml;base64,${btoa(`
        <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
          <rect width='100%' height='100%' fill='#dbeafe'/>
          <circle cx='50%' cy='50%' r='80' fill='#3b82f6' opacity='0.15'/>
          <circle cx='30%' cy='30%' r='40' fill='#1e3a8a' opacity='0.1'/>
        </svg>
      `)}")`,
                }}
              />
            )}

            <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
              <button
                onClick={() => profileBannerInputRef.current?.click()}
                className="bg-white text-blue-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-200"
              >
                {profileBannerPreview ||
                isValidImageUrl(currentProfileBanner) ? (
                  <ImageIcon className="w-5 h-5" />
                ) : (
                  <span className="flex items-center">
                    <ImageIcon className="w-5 h-5" />
                    <span className="sr-only">Add banner image</span>
                  </span>
                )}
              </button>
            </div>

            {profileBannerPreview && (
              <button
                onClick={resetProfileBanner}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <input
              ref={profileBannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileBannerSelect}
              className="hidden"
            />
          </div>

          <div className="flex flex-col items-center -mt-12">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 shadow-lg">
                {profilePicturePreview ||
                isValidImageUrl(profilePictureUrl) ||
                isValidImageUrl(currentProfilePicture) ? (
                  <>
                    {isProfilePictureLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={
                        profilePicturePreview ||
                        profilePictureUrl ||
                        currentProfilePicture
                      }
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                      onLoad={() => setIsProfilePictureLoading(false)}
                      onError={(e) => {
                        setIsProfilePictureLoading(false);

                        e.currentTarget.style.display = "none";

                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const initialDiv = document.createElement("div");
                          initialDiv.className =
                            "w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600";

                          const initialSpan = document.createElement("span");
                          initialSpan.className =
                            "text-2xl sm:text-3xl font-bold text-gray-400 dark:text-gray-300";
                          initialSpan.textContent =
                            editName?.[0]?.toUpperCase() || "U";

                          initialDiv.appendChild(initialSpan);
                          parent.appendChild(initialDiv);
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-400 dark:text-gray-300">
                      {editName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>

              <div
                onClick={() => profilePictureInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center  bg-opacity-0 group-hover:bg-opacity-30 cursor-pointer transition-all duration-200"
              >
                <CameraIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200" />
              </div>

              {profilePicturePreview && (
                <button
                  onClick={resetProfilePicture}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <input
                ref={profilePictureInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureSelect}
                className="hidden"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click on images to edit with advanced tools • Max size: 1MB
                (profile) / 2MB (banner)
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Crop, resize, zoom, and position your images perfectly
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Username
            </label>
            <input
              type="text"
              id="name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editName.trim() || isSaving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>

      {imageEditorOpen && editingImageFile && (
        <ImageEditorModal
          isOpen={imageEditorOpen}
          onClose={handleImageEditorClose}
          onSave={handleImageEditorSave}
          imageFile={editingImageFile}
          aspectRatio={editingImageType === "profile" ? 1 : 16 / 9}
          title={
            editingImageType === "profile"
              ? "Edit Profile Picture"
              : "Edit Profile Banner"
          }
          sourceModal={editingImageType}
        />
      )}
    </div>
  );
};
