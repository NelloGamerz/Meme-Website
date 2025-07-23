import type React from "react"
import { useRef, useState } from "react"
import { X, CameraIcon } from "lucide-react"
import { toast } from "react-hot-toast"
import { useModalControls } from "../../hooks/useModalControls"
import { ImageEditorModal } from "./ImageEditorModal"

interface ProfilePictureModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

const validateProfilePicture = (file: File): { valid: boolean; message: string } => {
  if (file.size > 1024 * 1024) {
    return { valid: false, message: "Profile picture must be less than 1MB" }
  }

  if (!file.type.startsWith("image/")) {
    return { valid: false, message: "File must be an image" }
  }

  return { valid: true, message: "" }
}

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useModalControls(isOpen, onClose);

  const resetUpload = () => {
    setSelectedFile(null)
    setIsEditorOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validation = validateProfilePicture(file)
      if (!validation.valid) {
        toast.error(validation.message)
        return
      }

      setSelectedFile(file)
      setIsEditorOpen(true)
    }
  }

  const handleEditorSave = async (editedBlob: Blob) => {
    try {
      const editedFile = new File([editedBlob], selectedFile?.name || "profile.png", {
        type: "image/png",
      })
      
      await onUpload(editedFile)
      resetUpload()
      onClose()
    } catch (error) {
      toast.error("Failed to upload profile picture.")
    }
  }

  const handleClose = () => {
    resetUpload()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Update Profile Picture</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto flex items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="text-center">
                <CameraIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Click to select</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>
      </div>

      {selectedFile && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleEditorSave}
          imageFile={selectedFile}
          title="Edit Profile Picture"
          sourceModal="profile"
          aspectRatio={1}
        />
      )}
    </>
  )
}
