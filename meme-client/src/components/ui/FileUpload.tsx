import React, { useState } from 'react';
import { ImagePlus, Upload, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  sublabel?: string;
  theme?: 'default' | 'creative';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  accept = "image/*",
  maxSize = 10,
  label = "Click to upload an image",
  sublabel = "PNG, JPG, GIF up to 10MB",
  theme = 'creative'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }
    
    if (accept !== "*") {
      const fileType = file.type;
      const acceptedTypes = accept.split(",").map(type => type.trim());
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith("/*")) {
          const category = type.split("/")[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });
      
      if (!isAccepted) {
        setError("File type not supported");
        return false;
      }
    }
    
    setError(null);
    return true;
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileChange(file);
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileChange(file);
      }
    }
  };
  
  const uniqueId = `file-upload-${Math.random().toString(36).substring(2, 9)}`;
  
  let containerStyles = `border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
    dragActive 
      ? "border-blue-500 bg-blue-50" 
      : error 
        ? "border-red-300 bg-red-50" 
        : "border-gray-300 hover:border-gray-400"
  }`;
  
  let iconStyles = `mb-3 ${error ? "text-red-400" : "text-gray-400"}`;
  
  if (theme === 'creative') {
    containerStyles = `border-3 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
      dragActive 
        ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg transform scale-[1.02]" 
        : error 
          ? "border-red-300 bg-red-50" 
          : "border-indigo-200 hover:border-indigo-400 hover:shadow-md bg-gradient-to-r from-gray-50 to-white"
    }`;
    
    iconStyles = `mb-4 ${
      error 
        ? "text-red-400" 
        : dragActive 
          ? "text-indigo-500" 
          : "text-indigo-400"
    }`;
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={containerStyles}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={uniqueId}
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        <label
          htmlFor={uniqueId}
          className="cursor-pointer flex flex-col items-center justify-center py-4"
        >
          {error ? (
            <AlertCircle size={56} className="text-red-400 mb-3" />
          ) : dragActive ? (
            <Upload size={56} className={iconStyles} />
          ) : (
            <ImagePlus size={56} className={iconStyles} />
          )}
          
          <span className={`text-lg font-medium ${
            error 
              ? "text-red-700" 
              : dragActive 
                ? "text-indigo-700" 
                : "text-gray-700"
          }`}>
            {error || (dragActive ? "Drop your file here" : label)}
          </span>
          
          {!error && (
            <span className={`text-sm mt-2 ${
              dragActive ? "text-indigo-500" : "text-gray-500"
            }`}>
              {sublabel}
            </span>
          )}
          
          {!error && theme === 'creative' && !dragActive && (
            <div className="mt-4 flex items-center justify-center">
              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                Browse files
              </span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};