
import React from 'react';

interface AliasSuggestionsProps {
  aliases: string[];
  onAliasClick: (alias: string) => void;
  onAddAllAliases: () => void;
}

export const AliasSuggestions: React.FC<AliasSuggestionsProps> = ({ aliases, onAliasClick, onAddAllAliases }) => {
  return (
    <div className="mt-5 pt-4 border-t border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-400">Found Aliases (Click to add to search):</h3>
        {aliases.length > 1 && (
          <button
            onClick={onAddAllAliases}
            className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
          >
            + Add All
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {aliases.map(alias => (
          <button
            key={alias}
            onClick={() => onAliasClick(alias)}
            className="px-3 py-1.5 text-sm font-medium bg-gray-700/50 text-indigo-300 rounded-full hover:bg-gray-700 hover:text-white transition-colors duration-200"
          >
            + {alias}
          </button>
        ))}
      </div>
    </div>
  );
};
