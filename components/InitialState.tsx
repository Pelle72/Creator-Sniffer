
import React from 'react';

export const InitialState: React.FC = () => {
  return (
    <div className="text-center p-8 bg-gray-800/50 border border-dashed border-gray-700 rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-300 mb-2">Ready to Discover?</h2>
      <p className="text-gray-400 max-w-md mx-auto">
        Enter the name of a Patreon creator above and click search. Our AI will scan public sources like Reddit, Twitter, and portfolios to find freely available content.
      </p>
    </div>
  );
};
