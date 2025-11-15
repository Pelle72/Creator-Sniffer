import React, { useState, useEffect } from 'react';
import type { SearchResult } from '../types';
import { LinkIcon } from './icons/LinkIcon';
import { StarIcon } from './icons/StarIcon';

const getFaviconUrl = (url: string) => {
  try {
      const urlObj = new URL(url);
      // Use a larger size for better quality in the placeholder
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch (e) {
      return ''; // Return empty string for invalid URLs
  }
}

const FaviconPlaceholder: React.FC<{ faviconUrl: string; hostname: string }> = ({ faviconUrl, hostname }) => (
    <div className="w-full h-40 sm:h-full flex flex-col items-center justify-center bg-gray-700/50 p-4 text-center">
      {faviconUrl ? (
        <img src={faviconUrl} alt={`${hostname} logo`} className="w-12 h-12 mb-3 rounded-md shadow-lg" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.881 4.108A9 9 0 112.98 12.019" />
        </svg>
      )}
      <span className="text-xs text-gray-400 font-medium break-all">{hostname}</span>
      <span className="text-xs text-gray-500 mt-1">No Thumbnail Found</span>
    </div>
  );

interface ResultCardProps {
  result: SearchResult;
  isFavorited: boolean;
  onToggleFavorite: (result: SearchResult) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, isFavorited, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(!result.thumbnailUrl);
  }, [result.thumbnailUrl]);

  const handleImageError = () => {
    setImageError(true);
  };

  const faviconUrl = getFaviconUrl(result.uri);
  let hostname = 'Invalid URL';
  try {
    hostname = new URL(result.uri).hostname;
  } catch (e) {
    console.warn(`Invalid URL encountered in ResultCard: ${result.uri}`);
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(result);
  };

  return (
    <a
      href={result.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col sm:flex-row bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-gray-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-900/40 animate-entry"
    >
      <div className="w-full sm:w-48 flex-shrink-0">
        {!imageError ? (
          <img
            src={result.thumbnailUrl}
            alt={`Thumbnail for ${result.title}`}
            className="w-full h-40 sm:h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <FaviconPlaceholder faviconUrl={faviconUrl} hostname={hostname} />
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow relative">
         <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-900/50 hover:bg-gray-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon 
            className={`h-6 w-6 transition-colors ${
              isFavorited ? 'text-yellow-400' : 'text-gray-500 group-hover:text-yellow-500'
            }`} 
            filled={isFavorited} 
          />
        </button>

        <div className="pr-10">
          <h3 className="text-lg font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors">
            {result.title || 'Untitled Link'}
          </h3>
        </div>
        <div className="flex-grow"></div>
        <div className="flex items-center mt-2 text-sm text-gray-400 group-hover:text-indigo-400 transition-colors">
          {faviconUrl && <img src={getFaviconUrl(result.uri).replace('sz=64', 'sz=16')} alt="" className="w-4 h-4 mr-2 rounded-sm" />}
          <span className="truncate">{hostname}</span>
          <LinkIcon className="h-4 w-4 ml-auto flex-shrink-0" />
        </div>
      </div>
    </a>
  );
};