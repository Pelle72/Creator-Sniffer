import React from 'react';
import type { SearchResult } from '../types';
import { ResultCard } from './ResultCard';

interface FavoritesListProps {
  favorites: SearchResult[];
  favoriteUris: Set<string>;
  onToggleFavorite: (result: SearchResult) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, favoriteUris, onToggleFavorite }) => {
  if (favorites.length === 0) {
    return (
       <div className="text-center p-8 bg-gray-800/50 border border-dashed border-gray-700 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Favorites Yet</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Click the star icon on any search result to save it here for later.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
        {favorites.map((result, index) => (
            <ResultCard 
              key={`${result.uri}-${index}`} 
              result={result} 
              isFavorited={favoriteUris.has(result.uri)}
              onToggleFavorite={onToggleFavorite}
            />
        ))}
    </div>
  );
};