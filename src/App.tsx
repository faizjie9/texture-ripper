import React, { useState, useRef } from 'react';
import Canvas from './components/Canvas';
import { TextureSlice } from './types';
import { FileUpload } from './components/FileUpload';
import { Github } from 'lucide-react';

interface ExtractedTexture {
  id: string;
  imageData: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [textures, setTextures] = useState<ExtractedTexture[]>([]);
  const [selectedTextureId, setSelectedTextureId] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_IMAGE_SIZE = 4096;
          if (img.width > MAX_IMAGE_SIZE || img.height > MAX_IMAGE_SIZE) {
            alert(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE}x${MAX_IMAGE_SIZE} pixels.`);
            return;
          }
          setImage(img);
        };
        img.onerror = () => {
          alert('Failed to load image. Please try again.');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        alert('Failed to load image. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_IMAGE_SIZE = 4096;
          if (img.width > MAX_IMAGE_SIZE || img.height > MAX_IMAGE_SIZE) {
            alert(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE}x${MAX_IMAGE_SIZE} pixels.`);
            return;
          }
          setImage(img);
        };
        img.onerror = () => {
          alert('Failed to load image. Please try again.');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        alert('Failed to load image. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please drop a valid image file.');
    }
  };

  const handleTextureExtracted = (textureDataUrl: string) => {
    const newTexture: ExtractedTexture = {
      id: Math.random().toString(36).substring(7),
      imageData: textureDataUrl,
      timestamp: Date.now()
    };
    setTextures(prev => [newTexture, ...prev]);
  };

  const handleDownload = (texture: ExtractedTexture) => {
    const link = document.createElement('a');
    link.href = texture.imageData;
    link.download = `texture-${texture.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Texture Ripper</h1>
          <p className="text-gray-400">Upload an image and select four points to extract a texture</p>
          <div className="flex justify-center items-center gap-4">
            <a 
              href="https://github.com/faizjie9/texture-ripper" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
            <a 
              href="https://github.com/faizpoerwita" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Made by @faizpoerwita
            </a>
          </div>
        </div>

        {/* File upload area */}
        {!image && (
          <div
            className={`h-[600px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-200 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Drop an image here</h3>
              <p className="text-gray-500 mb-4">or</p>
              <label className="inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-emerald-500/30">
                <span className="font-medium">Choose an image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="mt-4 text-sm text-gray-500">
                Supported formats: PNG, JPG, JPEG, WEBP
              </p>
            </div>
          </div>
        )}

        {/* Main canvas */}
        {image && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Canvas
                image={image}
                onTextureExtracted={handleTextureExtracted}
              />
            </div>

            {/* Extracted textures panel */}
            <div className="space-y-8">
              {/* Extracted textures panel */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Extracted Textures</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {textures.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      <p>No textures extracted yet</p>
                      <p className="text-sm mt-2">Select four points on the image to extract a texture</p>
                    </div>
                  ) : (
                    textures.map(texture => (
                      <div key={texture.id} className="bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="aspect-square w-full relative bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={texture.imageData}
                            alt="Extracted texture"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => handleDownload(texture)}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download PNG
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              2023 Texture Ripper
            </span>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/faizjie9/texture-ripper" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                View Source
              </a>
              <a 
                href="https://github.com/faizpoerwita" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Made with ❤️ by @faizpoerwita
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
