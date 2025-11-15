import React, { useState, useEffect, useRef } from 'react';
import type { ApiProvider } from '../types';
import { XIcon } from './icons/XIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: ApiProvider, geminiKey: string, xaiKey: string, ageConfirmed: boolean) => void;
  currentProvider: ApiProvider;
  currentGeminiKey: string;
  currentXaiKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProvider,
  currentGeminiKey,
  currentXaiKey,
}) => {
  const [provider, setProvider] = useState<ApiProvider>(currentProvider);
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey);
  const [xaiKey, setXaiKey] = useState(currentXaiKey);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProvider(currentProvider);
      setGeminiKey(currentGeminiKey);
      setXaiKey(currentXaiKey);
      setAgeConfirmed(false); // Reset on open
    }
  }, [isOpen, currentProvider, currentGeminiKey, currentXaiKey]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  const handleSave = () => {
    onSave(provider, geminiKey, xaiKey, ageConfirmed);
  };

  const handleProviderChange = (p: ApiProvider) => {
    setProvider(p);
    setAgeConfirmed(false); // Must re-confirm when switching
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      aria-labelledby="settings-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700 animate-entry"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="settings-modal-title" className="text-xl font-semibold text-white">API Settings</h2>
          <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white">
             <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">API Provider</label>
            <div className="flex items-center p-1 bg-gray-900 rounded-lg">
              {(['gemini', 'grok'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${provider === p ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
                >
                  {p === 'grok' ? 'Grok (xAI)' : 'Gemini'}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400 bg-gray-900 p-2 rounded-md">
                {provider === 'gemini' 
                    ? <><span className="font-bold text-indigo-400">Gemini:</span> Uses Google Search for deep, live internet investigation. Recommended for most users. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Get a key here.</a></>
                    : <><span className="font-bold text-yellow-400">Grok (xAI):</span> Uses Grok-4 with web search. A powerful alternative. <a href="https://x.ai/api" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Get an API key here.</a></>
                }
            </p>
          </div>

          {provider === 'grok' && (
            <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg space-y-3 animate-entry">
                <h4 className="font-bold text-yellow-300">Content Warning & Age Verification</h4>
                <p className="text-xs text-yellow-200">
                    xAI's Grok model is significantly less restrictive. Content generated may not be suitable for all audiences. By proceeding, you confirm you are 18 or older and consent to view potentially adult-oriented content.
                </p>
                <div className="flex items-center pt-2">
                    <input 
                        type="checkbox" 
                        id="age-confirm"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900 cursor-pointer"
                    />
                    <label htmlFor="age-confirm" className="ml-2 text-sm text-gray-200 cursor-pointer">
                        I am 18 or older and I understand.
                    </label>
                </div>
            </div>
          )}

          <div>
            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
            <input
              type="password"
              id="gemini-key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="xai-key" className="block text-sm font-medium text-gray-300 mb-2">xAI API Key</label>
            <input
              type="password"
              id="xai-key"
              value={xaiKey}
              onChange={(e) => setXaiKey(e.target.value)}
              placeholder="Enter your xAI API key"
              className="w-full bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition px-3 py-2"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={provider === 'grok' && !ageConfirmed}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};