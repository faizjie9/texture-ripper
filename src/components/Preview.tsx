import React from 'react';
import { TextureSlice } from '../types';

interface PreviewProps {
  textures: TextureSlice[];
  selectedTextureId?: string;
  onTextureSelect: (id: string) => void;
  onTextureDelete: (id: string) => void;
}

const Preview: React.FC<PreviewProps> = ({
  textures,
  selectedTextureId,
  onTextureSelect,
  onTextureDelete,
}) => {
  if (textures.length === 0) {
    return (
      <div className="text-gray-400 text-center p-4">
        No textures extracted yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {textures.map((texture) => (
        <div
          key={texture.id}
          className={`group relative rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105 ${
            selectedTextureId === texture.id
              ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'hover:ring-2 hover:ring-emerald-400'
          }`}
          onClick={() => onTextureSelect(texture.id)}
        >
          {/* Texture Image */}
          <div className="relative aspect-square bg-gray-900/50">
            <img
              src={texture.texture}
              alt={`Texture ${texture.id}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Failed to load texture:', e);
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+';
              }}
            />
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center">
              <span className="text-sm text-white font-medium">
                {`Texture ${textures.indexOf(texture) + 1}`}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTextureDelete(texture.id);
                }}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transform transition-all duration-200 hover:scale-110 opacity-90 hover:opacity-100"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Selected Indicator */}
          {selectedTextureId === texture.id && (
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Preview;
