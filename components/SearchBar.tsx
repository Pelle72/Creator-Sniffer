import React, { useRef } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import type { SearchType, ImagePayload } from '../types';
import { ImageIcon } from './icons/ImageIcon';
import { XIcon } from './icons/XIcon';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  useWildcard: boolean;
  setUseWildcard: (enabled: boolean) => void;
  searchForEmails: boolean;
  setSearchForEmails: (enabled: boolean) => void;
  imagePayload: ImagePayload | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  query, 
  setQuery, 
  onSearch, 
  isLoading, 
  searchType, 
  setSearchType,
  useWildcard,
  setUseWildcard,
  searchForEmails,
  setSearchForEmails,
  imagePayload,
  onImageUpload,
  onRemoveImage,
}) => {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const SearchTypeButton: React.FC<{ value: SearchType; label: string }> = ({ value, label }) => (
    <button
      type="button"
      role="radio"
      aria-checked={searchType === value}
      onClick={() => !isLoading && setSearchType(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        searchType === value
          ? 'bg-indigo-600 text-white shadow'
          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
      }`}
      disabled={isLoading}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 items-start">
        <div className="flex-grow space-y-3">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={imagePayload ? "Add an optional hint for the image..." : "Creator's name, alias, or a name of their work..."}
              className="flex-grow bg-gray-800 border-2 border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 px-4 py-3 text-base sm:text-lg"
              disabled={isLoading}
            />
             <input
              type="file"
              ref={fileInputRef}
              onChange={onImageUpload}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex-shrink-0 inline-flex items-center justify-center p-3 sm:p-4 text-base sm:text-lg font-semibold text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="Upload an image"
            >
              <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="submit"
              className="flex-shrink-0 inline-flex items-center justify-center px-5 py-3 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <SearchIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="ml-2 hidden sm:inline">Search</span>
            </button>
          </div>
            {imagePayload && (
              <div className="relative inline-block animate-entry">
                <img
                  src={`data:${imagePayload.mimeType};base64,${imagePayload.data}`}
                  alt="Image preview"
                  className="h-20 w-20 rounded-lg object-cover border-2 border-indigo-500"
                />
                <button
                  onClick={onRemoveImage}
                  className="absolute -top-2 -right-2 p-1 bg-gray-700 text-white rounded-full hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Remove image"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
        </div>
      </form>
      {!imagePayload && (
        <div className="flex flex-col items-center justify-center gap-4 animate-entry">
            <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Search type">
                <span className="text-sm font-medium text-gray-400 mr-2">Search by:</span>
                <div className="flex items-center p-1 bg-gray-800 rounded-lg">
                    <SearchTypeButton value="creator" label="Creator Name/Alias" />
                    <SearchTypeButton value="work" label="Title of Work" />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id="wildcard-search"
                            type="checkbox"
                            checked={useWildcard}
                            onChange={(e) => setUseWildcard(e.target.checked)}
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900 cursor-pointer"
                        />
                    </div>
                    <div className="ml-3 text-sm text-left">
                        <label htmlFor="wildcard-search" className="font-medium text-gray-300 cursor-pointer">
                            'Wild Card' Search
                        </label>
                        <p className="text-gray-500">Enable broader alias matching (e.g., name123).</p>
                    </div>
                </div>
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id="email-search"
                            type="checkbox"
                            checked={searchForEmails}
                            onChange={(e) => setSearchForEmails(e.target.checked)}
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900 cursor-pointer"
                        />
                    </div>
                    <div className="ml-3 text-sm text-left">
                        <label htmlFor="email-search" className="font-medium text-gray-300 cursor-pointer">
                           Search for Emails
                        </label>
                        <p className="text-gray-500">Look for publicly available email addresses.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};