import React, { useState, useCallback, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResultsList } from './components/ResultsList';
import { findContent } from './services/apiService';
import type { SearchResult, SearchType, ImagePayload, ApiProvider } from './types';
import { InitialState } from './components/InitialState';
import { FavoritesList } from './components/FavoritesList';
import { AliasSuggestions } from './components/AliasSuggestions';
import { ChiknNuggitLoader } from './components/ChiknNuggitLoader';
import { CommunityLinks } from './components/CommunityLinks';
import { SettingsModal } from './components/SettingsModal';
import { SettingsIcon } from './components/icons/SettingsIcon';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('creator');
  const [useWildcard, setUseWildcard] = useState(false);
  const [searchForEmails, setSearchForEmails] = useState(false);
  const [imagePayload, setImagePayload] = useState<ImagePayload | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [communityLinks, setCommunityLinks] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState<SearchResult[]>([]);
  const [view, setView] = useState<'search' | 'favorites'>('search');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiProvider, setApiProvider] = useState<ApiProvider>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [isGrokAgeVerified, setIsGrokAgeVerified] = useState(false); // Session-based verification

  // Load settings and favorites from localStorage on initial mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('creator-content-favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));

      const storedProvider = localStorage.getItem('sniffer-api-provider') as ApiProvider;
      if (storedProvider) setApiProvider(storedProvider);
      
      const storedGeminiKey = localStorage.getItem('sniffer-gemini-key');
      if (storedGeminiKey) setGeminiApiKey(storedGeminiKey);
      
      const storedXaiKey = localStorage.getItem('sniffer-xai-key');
      if (storedXaiKey) setXaiApiKey(storedXaiKey);

    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('creator-content-favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  const handleSaveSettings = (provider: ApiProvider, newGeminiKey: string, newXaiKey: string, ageConfirmed: boolean) => {
    setApiProvider(provider);
    setGeminiApiKey(newGeminiKey);
    setXaiApiKey(newXaiKey);

    if (provider === 'grok' && ageConfirmed) {
      setIsGrokAgeVerified(true);
    } else if (provider !== 'grok') {
      setIsGrokAgeVerified(false);
    }

    try {
      localStorage.setItem('sniffer-api-provider', provider);
      localStorage.setItem('sniffer-gemini-key', newGeminiKey);
      localStorage.setItem('sniffer-xai-key', newXaiKey);
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
    setIsSettingsOpen(false);
  };
  
  const toggleFavorite = useCallback((resultToToggle: SearchResult) => {
    setFavorites(currentFavorites => {
      const isFavorited = currentFavorites.some(fav => fav.uri === resultToToggle.uri);
      if (isFavorited) {
        return currentFavorites.filter(fav => fav.uri !== resultToToggle.uri);
      } else {
        return [...currentFavorites, resultToToggle];
      }
    });
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError("Image file is too large. Please upload an image under 4MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImagePayload({
            mimeType: file.type,
            data: base64String,
        });
        setError(null);
    };
    reader.onerror = () => {
        setError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
      setImagePayload(null);
  };

  const executeSearch = useCallback(async (
    currentQuery: string, 
    currentSearchType: SearchType,
    currentImage: ImagePayload | null,
    wildcardEnabled: boolean,
    emailsEnabled: boolean,
    appendResults: boolean = false
    ) => {
    if (!currentQuery.trim() && !currentImage) {
      setError('Please enter a search term or upload an image.');
      return;
    }
    
    if (apiProvider === 'gemini' && !geminiApiKey) {
      setError('Gemini API key is missing. Please add it in the settings.');
      setIsSettingsOpen(true);
      return;
    }
     if (apiProvider === 'grok' && !xaiApiKey) {
      setError('xAI API key is missing. Please add it in the settings.');
      setIsSettingsOpen(true);
      return;
    }

    if (apiProvider === 'grok' && !isGrokAgeVerified) {
      setError('You must confirm the content warning for Grok in settings before searching.');
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    if (!appendResults) {
      setResults([]);
      setSummary('');
      setAliases([]);
      setCommunityLinks([]);
    }
    setHasSearched(true);
    setView('search');

    const favoritedUris = favorites.map(fav => fav.uri);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        const providerName = apiProvider.charAt(0).toUpperCase() + apiProvider.slice(1);
        setError(`The search with ${providerName} took too long and was cancelled. Please try again or use the other provider.`);
        setIsLoading(false);
    }, 120000); // 2 minute timeout for complex searches

    try {
      const response = await findContent({
        provider: apiProvider,
        query: currentQuery, 
        searchType: currentSearchType, 
        favoritedUris, 
        signal: controller.signal,
        image: currentImage,
        useWildcard: wildcardEnabled,
        searchForEmails: emailsEnabled,
        geminiApiKey: geminiApiKey,
        xaiApiKey: xaiApiKey,
        isGrokAgeVerified: isGrokAgeVerified
      });
      
      setSummary(response.summary);
      setAliases(response.aliases);
      setCommunityLinks(response.communityLinks);
      
      setResults(prevResults => {
        if (!appendResults) {
          return response.results;
        }
        const existingUris = new Set(prevResults.map(r => r.uri));
        const newUniqueResults = response.results.filter(r => !existingUris.has(r.uri));
        return [...prevResults, ...newUniqueResults];
      });

    } catch (err: any) {
      // Silently handle cancellation errors, as the timeout callback sets the UI message.
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.error(err);
        setError(`An API error occurred: ${err.message}. Check your API key or try a different provider.`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [favorites, apiProvider, geminiApiKey, xaiApiKey, isGrokAgeVerified]);

  const handleSearch = useCallback(() => {
    executeSearch(query, searchType, imagePayload, useWildcard, searchForEmails, false);
  }, [query, searchType, imagePayload, useWildcard, searchForEmails, executeSearch]);

  const handleAliasSearch = useCallback((alias: string) => {
    const existingAliases = query.split(/, ?/).map(q => q.trim().toLowerCase());
    if (existingAliases.includes(alias.toLowerCase())) return;

    const newQuery = query ? `${query}, ${alias}` : alias;
    setQuery(newQuery);
    setSearchType('creator'); 
    setImagePayload(null); // Clear image when doing a text-based alias search
    executeSearch(newQuery, 'creator', null, useWildcard, searchForEmails, true);
  }, [query, executeSearch, useWildcard, searchForEmails]);

  const handleAddAllAliases = useCallback(() => {
    const existingQueryAliases = new Set(query.split(/, ?/).map(q => q.trim().toLowerCase()));
    
    const newAliasesToAdd = aliases.filter(alias => !existingQueryAliases.has(alias.toLowerCase()));

    if (newAliasesToAdd.length === 0) return;

    const currentQueryParts = query.trim() ? query.split(/, ?/).map(q => q.trim()) : [];
    const newQueryParts = [...currentQueryParts, ...newAliasesToAdd];
    const newQuery = newQueryParts.join(', ');

    setQuery(newQuery);
    setSearchType('creator'); 
    setImagePayload(null);
    executeSearch(newQuery, 'creator', null, useWildcard, searchForEmails, true);
  }, [query, aliases, executeSearch, useWildcard, searchForEmails]);


  const favoriteUris = React.useMemo(() => new Set(favorites.map(f => f.uri)), [favorites]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
       {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          currentProvider={apiProvider}
          currentGeminiKey={geminiApiKey}
          currentXaiKey={xaiApiKey}
        />
      )}
      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <header className="relative text-center mb-10">
          <h1 className="font-logo text-5xl sm:text-6xl text-yellow-300 tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Creator Sniffer
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Sniff out public content from your favorite creators across the web.
          </p>
           <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Open settings"
           >
              <SettingsIcon className="h-6 w-6" />
           </button>
        </header>

        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          searchType={searchType}
          setSearchType={setSearchType}
          useWildcard={useWildcard}
          setUseWildcard={setUseWildcard}
          searchForEmails={searchForEmails}
          setSearchForEmails={setSearchForEmails}
          imagePayload={imagePayload}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />

        <div className="mt-12">
          {!hasSearched && !isLoading && <InitialState />}
          {isLoading && <ChiknNuggitLoader />}
          {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
          
          {hasSearched && !error && !isLoading && (
            <div className="mt-8">
              <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  <button
                    onClick={() => setView('search')}
                    className={`${
                      view === 'search'
                        ? 'border-indigo-400 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    Search Results
                  </button>
                  <button
                    onClick={() => setView('favorites')}
                    className={`${
                      view === 'favorites'
                        ? 'border-indigo-400 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    aria-current={view === 'favorites' ? 'page' : undefined}
                  >
                    Favorites ({favorites.length})
                  </button>
                </nav>
              </div>

              {view === 'search' && (
                <>
                  {(summary || aliases.length > 0 || results.length > 0 || communityLinks.length > 0) && (
                     <div className="mb-8 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-indigo-400 mb-3">AI Summary</h2>
                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{summary}</p>
                        {aliases.length > 0 && (
                          <AliasSuggestions 
                            aliases={aliases} 
                            onAliasClick={handleAliasSearch} 
                            onAddAllAliases={handleAddAllAliases}
                          />
                        )}
                        {communityLinks.length > 0 && (
                          <CommunityLinks links={communityLinks} />
                        )}
                    </div>
                  )}
                  {results.length > 0 ? (
                    <ResultsList results={results} favoriteUris={favoriteUris} onToggleFavorite={toggleFavorite} />
                  ) : (
                    !isLoading && hasSearched && <p className="text-center text-gray-500 py-8">No public content found for "{query}".</p>
                  )}
                </>
              )}

              {view === 'favorites' && (
                <FavoritesList favorites={favorites} favoriteUris={favoriteUris} onToggleFavorite={toggleFavorite} />
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="text-center py-4 px-4">
        <p className="text-yellow-400 font-handwritten text-lg tracking-wide">
          ©2025 Digital Creative Content
        </p>
      </footer>
    </div>
  );
};

export default App;