import React from 'react';
import type { SearchResult } from '../types';
import { ResultCard } from './ResultCard';

interface ResultsListProps {
  results: SearchResult[];
  favoriteUris: Set<string>;
  onToggleFavorite: (result: SearchResult) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({ results, favoriteUris, onToggleFavorite }) => {
  return (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold text-purple-400 border-b-2 border-gray-700 pb-2">Discovered Links</h2>
        {results.map((result, index) => (
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