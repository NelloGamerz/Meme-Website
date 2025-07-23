import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, ArrowLeft, Image, Share2 } from 'lucide-react';
import { FileUpload } from '../components/ui/FileUpload';
import { ImagePreview } from '../components/ui/ImagePreview';
import { Button } from '../components/ui/Button';

// Define types for our form data
interface FormData {
  file: File | null;
  prompt: string;
  caption: string;
}

export const CreatePage = () => {
  // Add custom CSS for extra small screens
  useEffect(() => {
    // Add the xs breakpoint for screens smaller than sm (640px)
    const style = document.createElement('style');
    style.innerHTML = `
      @media (min-width: 480px) {
        .xs\\:inline {
          display: inline;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // State for active tab (meme or emoji)
  const [activeTab, setActiveTab] = useState<'meme' | 'emoji'>('meme');
  
  // State for creation method (AI or upload)
  const [memeCreationMethod, setMemeCreationMethod] = useState<'ai' | 'upload'>('ai');
  const [emojiCreationMethod, setEmojiCreationMethod] = useState<'ai' | 'upload'>('ai');
  
  // Step tracking for wizard-style interface
  const [memeStep, setMemeStep] = useState<'method' | 'create' | 'caption'>('method');
  const [emojiStep, setEmojiStep] = useState<'method' | 'create' | 'caption'>('method');
  
  // Custom step setters that handle resetting form data
  const setMemeStepWithReset = (step: 'method' | 'create' | 'caption') => {
    setMemeStep(step);
    if (step === 'method') {
      // Reset form data when going back to method selection
      setMemeFormData({
        ...memeFormData,
        prompt: '',
        file: null
      });
      setMemePreview(null);
    }
  };
  
  const setEmojiStepWithReset = (step: 'method' | 'create' | 'caption') => {
    setEmojiStep(step);
    if (step === 'method') {
      // Reset form data when going back to method selection
      setEmojiFormData({
        ...emojiFormData,
        prompt: '',
        file: null
      });
      setEmojiPreview(null);
    }
  };
  
  // Form data for meme and emoji
  const [memeFormData, setMemeFormData] = useState<FormData>({
    file: null,
    prompt: '',
    caption: ''
  });
  
  const [emojiFormData, setEmojiFormData] = useState<FormData>({
    file: null,
    prompt: '',
    caption: ''
  });
  
  // Loading states
  const [isGeneratingMeme, setIsGeneratingMeme] = useState(false);
  const [isGeneratingEmoji, setIsGeneratingEmoji] = useState(false);
  
  // Preview states
  const [memePreview, setMemePreview] = useState<string | null>(null);
  const [emojiPreview, setEmojiPreview] = useState<string | null>(null);
  
  // These handlers have been replaced by the FileUpload component's onFileChange prop
  
  // Handle text input changes for memes
  const handleMemeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMemeFormData({
      ...memeFormData,
      [name]: value
    });
  };
  
  // Handle text input changes for emojis
  const handleEmojiInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmojiFormData({
      ...emojiFormData,
      [name]: value
    });
  };
  
  // Generate meme with AI
  const generateMemeWithAI = async () => {
    setIsGeneratingMeme(true);
    try {
      // This is a placeholder for the actual API call
      // const response = await api.post('/memes/generate', {
      //   prompt: memeFormData.prompt
      // });
      // setMemePreview(response.data.imageUrl);
      
      // Simulate API response for now
      setTimeout(() => {
        setMemePreview('https://placehold.co/600x400/png?text=AI+Generated+Meme');
        setIsGeneratingMeme(false);
        // Move to the caption step after generation is complete
        setMemeStep('caption');
      }, 2000);
    } catch (error) {
      console.error('Error generating meme:', error);
      setIsGeneratingMeme(false);
    }
  };
  
  // Generate emoji with AI
  const generateEmojiWithAI = async () => {
    setIsGeneratingEmoji(true);
    try {
      // This is a placeholder for the actual API call
      // const response = await api.post('/emojis/generate', {
      //   prompt: emojiFormData.prompt
      // });
      // setEmojiPreview(response.data.imageUrl);
      
      // Simulate API response for now
      setTimeout(() => {
        setEmojiPreview('https://placehold.co/200x200/png?text=AI+Emoji');
        setIsGeneratingEmoji(false);
        // Move to the caption step after generation is complete
        setEmojiStep('caption');
      }, 2000);
    } catch (error) {
      console.error('Error generating emoji:', error);
      setIsGeneratingEmoji(false);
    }
  };
  
  // Submit meme creation
  const submitMemeCreation = async () => {
    try {
      const formData = new FormData();
      
      if (memeCreationMethod === 'upload' && memeFormData.file) {
        formData.append('file', memeFormData.file);
      } else if (memeCreationMethod === 'ai') {
        formData.append('prompt', memeFormData.prompt);
        // If we have a generated image URL, we might need to handle it differently
        // This depends on your backend implementation
      }
      
      formData.append('caption', memeFormData.caption);
      
      // This is a placeholder for the actual API call
      // await api.post('/memes/create', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });
      
      // Reset form after successful submission
      alert('Meme created successfully!');
      setMemeFormData({
        file: null,
        prompt: '',
        caption: ''
      });
      setMemePreview(null);
      setMemeStep('method');
    } catch (error) {
      console.error('Error creating meme:', error);
      alert('Failed to create meme. Please try again.');
    }
  };
  
  // Submit emoji creation
  const submitEmojiCreation = async () => {
    try {
      const formData = new FormData();
      
      if (emojiCreationMethod === 'upload' && emojiFormData.file) {
        formData.append('file', emojiFormData.file);
      } else if (emojiCreationMethod === 'ai') {
        formData.append('prompt', emojiFormData.prompt);
        // If we have a generated image URL, we might need to handle it differently
        // This depends on your backend implementation
      }
      
      formData.append('caption', emojiFormData.caption);
      
      alert('Emoji created successfully!');
      setEmojiFormData({
        file: null,
        prompt: '',
        caption: ''
      });
      setEmojiPreview(null);
      setEmojiStep('method');
    } catch (error) {
      alert('Failed to create emoji. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-gray-800">
          Create Content
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Make memes and emojis to share with the community
        </p>
      </div>
      
      {/* Tab Navigation - Improved for mobile */}
      <div className="flex justify-center mb-6 md:mb-8 px-2 sm:px-0">
        <div className="bg-gray-100 rounded-lg p-1 flex w-full max-w-md shadow-sm">
          <button
            className={`py-2 px-2 sm:px-4 font-medium rounded-md transition-all duration-200 flex-1 flex items-center justify-center ${
              activeTab === 'meme'
                ? 'bg-white text-indigo-600 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => {
              setActiveTab('meme');
              setMemeStepWithReset('method');
              // Reset creation method when switching tabs
              setMemeCreationMethod('ai');
            }}
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Create Meme</span>
          </button>
          <button
            className={`py-2 px-2 sm:px-4 font-medium rounded-md transition-all duration-200 flex-1 flex items-center justify-center ${
              activeTab === 'emoji'
                ? 'bg-white text-indigo-600 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => {
              setActiveTab('emoji');
              setEmojiStepWithReset('method');
              // Reset creation method when switching tabs
              setEmojiCreationMethod('ai');
            }}
          >
            <span className="mr-1 sm:mr-2">😊</span>
            <span className="text-sm sm:text-base">Create Emoji</span>
          </button>
        </div>
      </div>
      
      {/* Meme Creation Section */}
      {activeTab === 'meme' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Progress Steps - Improved for mobile */}
          <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className={`flex items-center ${memeStep === 'method' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 text-xs sm:text-sm ${memeStep === 'method' ? 'bg-indigo-100' : 'bg-gray-100'}`}>1</div>
                <span className="hidden xs:inline text-xs sm:text-sm">Choose</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2"></div>
              <div className={`flex items-center ${memeStep === 'create' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 text-xs sm:text-sm ${memeStep === 'create' ? 'bg-indigo-100' : 'bg-gray-100'}`}>2</div>
                <span className="hidden xs:inline text-xs sm:text-sm">Create</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2"></div>
              <div className={`flex items-center ${memeStep === 'caption' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 text-xs sm:text-sm ${memeStep === 'caption' ? 'bg-indigo-100' : 'bg-gray-100'}`}>3</div>
                <span className="hidden xs:inline text-xs sm:text-sm">Finish</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Step 1: Method Selection */}
            {memeStep === 'method' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">How would you like to create your meme?</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                      memeCreationMethod === 'ai' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => {
                      setMemeCreationMethod('ai');
                      setMemeStep('create');
                    }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3 sm:mb-4">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Generate with AI</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Describe your idea and let AI create a unique meme image for you</p>
                  </button>
                  
                  <button 
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                      memeCreationMethod === 'upload' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => {
                      setMemeCreationMethod('upload');
                      setMemeStep('create');
                    }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3 sm:mb-4">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Upload Your Own</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Use your own image to create a custom meme</p>
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Create Content */}
            {memeStep === 'create' && (
              <div className="max-w-2xl mx-auto">
                {/* AI Generation Form */}
                {memeCreationMethod === 'ai' && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Describe your meme</h2>
                      <p className="text-gray-600">Be specific about what you want to see in your meme</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <label htmlFor="meme-prompt" className="block text-base font-medium text-gray-800 mb-2">
                        Meme description
                      </label>
                      <div className="relative">
                        <textarea
                          id="meme-prompt"
                          name="prompt"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                          placeholder="E.g., A cat wearing sunglasses and riding a skateboard through space"
                          value={memeFormData.prompt}
                          onChange={handleMemeInputChange}
                        />
                        <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                          {memeFormData.prompt.length} / 500
                        </div>
                      </div>
                      
                      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-medium text-gray-700">Tips for better results:</p>
                        <ul className="text-xs text-gray-600 mt-1 list-disc pl-4 space-y-1">
                          <li>Include details about characters, expressions, and setting</li>
                          <li>Specify art style (cartoon, realistic, pixel art, etc.)</li>
                          <li>Mention colors and lighting for better results</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-8">
                      <Button
                        className="px-4 py-2"
                        onClick={() => setMemeStepWithReset('method')}
                        variant="ghost"
                        icon={ArrowLeft}
                      >
                        Back
                      </Button>
                      
                      <Button
                        className="px-6 py-2"
                        onClick={() => {
                          generateMemeWithAI();
                          if (!isGeneratingMeme) {
                            setMemeStep('caption');
                          }
                        }}
                        disabled={isGeneratingMeme || !memeFormData.prompt}
                        isLoading={isGeneratingMeme}
                        variant="primary"
                        icon={Sparkles}
                      >
                        Generate Meme
                      </Button>
                    </div>
                    
                    {isGeneratingMeme && (
                      <div className="text-center mt-4 text-sm text-indigo-600">
                        Creating your meme... This may take a moment.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upload Form */}
                {memeCreationMethod === 'upload' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Upload your image</h2>
                      <p className="text-sm sm:text-base text-gray-600">Choose a high-quality image to create your meme</p>
                    </div>
                    
                    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                      <FileUpload 
                        onFileChange={(file) => {
                          setMemeFormData({
                            ...memeFormData,
                            file
                          });
                          
                          // Create a preview
                          const reader = new FileReader();
                          reader.onload = () => {
                            setMemePreview(reader.result as string);
                            setMemeStep('caption');
                          };
                          reader.readAsDataURL(file);
                        }}
                        maxSize={10}
                        label="Drag & drop your image here or click to browse"
                        sublabel="PNG, JPG, GIF up to 10MB"
                        theme="default"
                      />
                    </div>
                    
                    <div className="flex justify-between mt-6 sm:mt-8">
                      <Button
                        className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base"
                        onClick={() => setMemeStepWithReset('method')}
                        variant="ghost"
                        icon={ArrowLeft}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 3: Caption and Finish */}
            {memeStep === 'caption' && memePreview && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Add a caption and share</h2>
                  <p className="text-sm sm:text-base text-gray-600">Give your meme a catchy caption before sharing</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-700">Preview</h3>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <ImagePreview 
                        src={memePreview} 
                        alt="Meme preview"
                        showZoom={true}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-700">Caption</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label htmlFor="meme-caption" className="block text-sm font-medium text-gray-700 mb-1">
                          Add a caption
                        </label>
                        <input
                          type="text"
                          id="meme-caption"
                          name="caption"
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                          placeholder="Something funny or descriptive..."
                          value={memeFormData.caption}
                          onChange={handleMemeInputChange}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          A good caption makes your meme more engaging
                        </p>
                      </div>
                      
                      <div className="pt-3 sm:pt-4">
                        <Button
                          className="w-full py-2 sm:py-3 text-sm sm:text-base"
                          onClick={submitMemeCreation}
                          variant="primary"
                          icon={Share2}
                        >
                          Create & Share Meme
                        </Button>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          By creating, you agree to our content guidelines
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-start mt-4 sm:mt-6">
                  <Button
                    className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base"
                    onClick={() => {
                      if (memeCreationMethod === 'ai') {
                        setMemeStep('create');
                      } else {
                        setMemeStepWithReset('method');
                      }
                    }}
                    variant="ghost"
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Emoji Creation Section */}
      {activeTab === 'emoji' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Progress Steps - Improved for mobile */}
          <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className={`flex items-center ${emojiStep === 'method' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 text-xs sm:text-sm ${emojiStep === 'method' ? 'bg-indigo-100' : 'bg-gray-100'}`}>1</div>
                <span className="hidden xs:inline text-xs sm:text-sm">Choose</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2"></div>
              <div className={`flex items-center ${emojiStep === 'create' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 text-xs sm:text-sm ${emojiStep === 'create' ? 'bg-indigo-100' : 'bg-gray-100'}`}>2</div>
                <span className="hidden xs:inline text-xs sm:text-sm">Create</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2"></div>
              <div className={`flex items-center ${emojiStep === 'caption' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 text-xs sm:text-sm ${emojiStep === 'caption' ? 'bg-indigo-100' : 'bg-gray-100'}`}>3</div>
                <span className="hidden xs:inline text-xs sm:text-sm">Finish</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Step 1: Method Selection */}
            {emojiStep === 'method' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">How would you like to create your emoji?</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                      emojiCreationMethod === 'ai' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => {
                      setEmojiCreationMethod('ai');
                      setEmojiStep('create');
                    }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3 sm:mb-4">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Generate with AI</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Describe your idea and let AI create a unique emoji for you</p>
                  </button>
                  
                  <button 
                    className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center ${
                      emojiCreationMethod === 'upload' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => {
                      setEmojiCreationMethod('upload');
                      setEmojiStep('create');
                    }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3 sm:mb-4">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Upload Your Own</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Use your own image to create a custom emoji</p>
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Create Content */}
            {emojiStep === 'create' && (
              <div className="max-w-2xl mx-auto">
                {/* AI Generation Form */}
                {emojiCreationMethod === 'ai' && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Describe your emoji</h2>
                      <p className="text-gray-600">Be specific about what you want to see in your emoji</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <label htmlFor="emoji-prompt" className="block text-base font-medium text-gray-800 mb-2">
                        Emoji description
                      </label>
                      <div className="relative">
                        <textarea
                          id="emoji-prompt"
                          name="prompt"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                          placeholder="E.g., A smiling sun with sunglasses and a tropical drink"
                          value={emojiFormData.prompt}
                          onChange={handleEmojiInputChange}
                        />
                        <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                          {emojiFormData.prompt.length} / 300
                        </div>
                      </div>
                      
                      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-medium text-gray-700">Emoji tips:</p>
                        <ul className="text-xs text-gray-600 mt-1 list-disc pl-4 space-y-1">
                          <li>Keep it simple and focused on a single expression or concept</li>
                          <li>Bright colors and clear designs work best for emojis</li>
                          <li>Consider how it will look when scaled down to smaller sizes</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-8">
                      <Button
                        className="px-4 py-2"
                        onClick={() => setEmojiStep('method')}
                        variant="ghost"
                        icon={ArrowLeft}
                      >
                        Back
                      </Button>
                      
                      <Button
                        className="px-6 py-2"
                        onClick={() => {
                          generateEmojiWithAI();
                          if (!isGeneratingEmoji) {
                            setEmojiStep('caption');
                          }
                        }}
                        disabled={isGeneratingEmoji || !emojiFormData.prompt}
                        isLoading={isGeneratingEmoji}
                        variant="primary"
                        icon={Sparkles}
                      >
                        Generate Emoji
                      </Button>
                    </div>
                    
                    {isGeneratingEmoji && (
                      <div className="text-center mt-4 text-sm text-indigo-600">
                        Creating your emoji... This may take a moment.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upload Form */}
                {emojiCreationMethod === 'upload' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Upload your emoji</h2>
                      <p className="text-sm sm:text-base text-gray-600">Choose a square image for best results</p>
                    </div>
                    
                    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                      <FileUpload 
                        onFileChange={(file) => {
                          setEmojiFormData({
                            ...emojiFormData,
                            file
                          });
                          
                          // Create a preview
                          const reader = new FileReader();
                          reader.onload = () => {
                            setEmojiPreview(reader.result as string);
                            setEmojiStep('caption');
                          };
                          reader.readAsDataURL(file);
                        }}
                        maxSize={5}
                        label="Drag & drop your emoji image here or click to browse"
                        sublabel="PNG, JPG, GIF up to 5MB (square images work best)"
                        theme="default"
                      />
                    </div>
                    
                    <div className="flex justify-center gap-3 sm:gap-4 flex-wrap mt-4 sm:mt-6">
                      <div className="text-center p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50 w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
                        <span className="block text-xl sm:text-2xl">😊</span>
                      </div>
                      <div className="text-center p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50 w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
                        <span className="block text-xl sm:text-2xl">🚀</span>
                      </div>
                      <div className="text-center p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50 w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
                        <span className="block text-xl sm:text-2xl">🎮</span>
                      </div>
                      <div className="text-center p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50 w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
                        <span className="block text-xl sm:text-2xl">🎨</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6 sm:mt-8">
                      <Button
                        className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base"
                        onClick={() => setEmojiStep('method')}
                        variant="ghost"
                        icon={ArrowLeft}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 3: Caption and Finish */}
            {emojiStep === 'caption' && emojiPreview && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Name your emoji and share</h2>
                  <p className="text-sm sm:text-base text-gray-600">Give your emoji a catchy name before sharing</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-700">Preview</h3>
                    <div className="flex justify-center">
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-full">
                        <ImagePreview 
                          src={emojiPreview} 
                          alt="Emoji preview" 
                          aspectRatio="square"
                          className="w-32 sm:w-40 h-32 sm:h-40"
                          showZoom={true}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-700">Name</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label htmlFor="emoji-caption" className="block text-sm font-medium text-gray-700 mb-1">
                          Name your emoji
                        </label>
                        <input
                          type="text"
                          id="emoji-caption"
                          name="caption"
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                          placeholder="E.g., CoolSun, HappyDance, GamingFace..."
                          value={emojiFormData.caption}
                          onChange={handleEmojiInputChange}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Give your emoji a catchy, memorable name
                        </p>
                      </div>
                      
                      <div className="pt-3 sm:pt-4">
                        <Button
                          className="w-full py-2 sm:py-3 text-sm sm:text-base"
                          onClick={submitEmojiCreation}
                          variant="primary"
                          icon={Share2}
                        >
                          Create & Share Emoji
                        </Button>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          Your emoji will be available for everyone to use in comments and reactions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-start mt-4 sm:mt-6">
                  <Button
                    className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base"
                    onClick={() => {
                      if (emojiCreationMethod === 'ai') {
                        setEmojiStep('create');
                      } else {
                        setEmojiStep('method');
                        setEmojiPreview(null);
                      }
                    }}
                    variant="ghost"
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};